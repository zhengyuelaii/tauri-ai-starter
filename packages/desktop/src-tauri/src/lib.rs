use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

struct ServerProcess(Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(ServerProcess(Mutex::new(None)))
        .setup(|app| {
            match app.shell().sidecar("binaries/server") {
                Ok(sidecar_command) => match sidecar_command.spawn() {
                    Ok((mut rx, child)) => {
                        *app.state::<ServerProcess>().0.lock().unwrap() = Some(child);

                        tauri::async_runtime::spawn(async move {
                            while let Some(event) = rx.recv().await {
                                match event {
                                    tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                                        println!("[server] {}", String::from_utf8_lossy(&line));
                                    }
                                    tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                                        eprintln!("[server:err] {}", String::from_utf8_lossy(&line));
                                    }
                                    tauri_plugin_shell::process::CommandEvent::Terminated(status) => {
                                        println!("[server] exited with {:?}", status);
                                    }
                                    _ => {}
                                }
                            }
                        });
                    }
                    Err(e) => {
                        eprintln!(
                            "[server] sidecar binary not found: {} (dev mode, skipping)",
                            e
                        );
                    }
                },
                Err(e) => {
                    eprintln!("[server] sidecar not configured: {} (skipping)", e);
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit = event {
            if let Some(state) = app_handle.try_state::<ServerProcess>() {
                if let Some(child) = state.0.lock().unwrap().take() {
                    let _ = child.kill();
                }
            }
        }
    });
}
