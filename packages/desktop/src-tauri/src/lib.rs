use std::net::TcpListener;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

struct ServerProcess(Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

struct ServerUrl(Mutex<String>);

#[tauri::command]
fn get_server_url(state: tauri::State<'_, ServerUrl>) -> String {
    state.0.lock().unwrap_or_else(|e| e.into_inner()).clone()
}

fn get_server_port() -> u16 {
    std::env::var("SERVER_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or_else(|| {
            TcpListener::bind("127.0.0.1:0")
                .and_then(|l| l.local_addr().map(|a| a.port()))
                .unwrap_or(3000)
        })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_server_url])
        .manage(ServerProcess(Mutex::new(None)))
        .manage(ServerUrl(Mutex::new("http://localhost:3000".into())))
        .setup(|app| {
            // Create the main window programmatically for overlay titlebar support
            let window_builder = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::App("/".into()),
            )
            .title("desktop")
            .inner_size(1280.0, 720.0)
            .min_inner_size(640.0, 480.0)
            .center()
            .visible(false)
            .decorations(true);

            #[cfg(target_os = "macos")]
            let window_builder = window_builder
                .title_bar_style(tauri::TitleBarStyle::Overlay)
                .hidden_title(true)
                .traffic_light_position(tauri::LogicalPosition::new(12.0, 18.0));

            let _window = window_builder
                .build()
                .expect("failed to create main window");

            if cfg!(debug_assertions) {
                eprintln!("[server] debug build: skipping sidecar (dev.cjs manages backend)");
            } else {
                match app.shell().sidecar("server") {
                Ok(sidecar_command) => {
                    let port = get_server_port();
                    let url = format!("http://127.0.0.1:{}", port);

                    *app.state::<ServerUrl>().0.lock().unwrap_or_else(|e| e.into_inner()) = url;
                    eprintln!("[server] starting on port {}", port);

                    match sidecar_command.env("PORT", port.to_string()).spawn() {
                    Ok((mut rx, child)) => {
                        *app.state::<ServerProcess>()
                            .0
                            .lock()
                            .unwrap_or_else(|e| e.into_inner()) = Some(child);

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
                        eprintln!("[server] sidecar spawn failed: {} (skipping)", e);
                    }
                    }
                },
                Err(e) => {
                    eprintln!("[server] sidecar not configured: {} (skipping)", e);
                }
                }
            }

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit = event {
            if let Some(state) = app_handle.try_state::<ServerProcess>() {
                if let Some(child) = state
                    .0
                    .lock()
                    .unwrap_or_else(|e| e.into_inner())
                    .take()
                {
                    let _ = child.kill();
                }
            }
        }

        // Force focus after webview is ready (macOS loses focus during sidecar init)
        if let tauri::RunEvent::Ready = event {
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    });
}
