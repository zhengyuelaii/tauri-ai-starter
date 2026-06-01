# Tauri Agent Workspace

一个桌面 AI Agent 开发平台——用户设定目标，Agent 自主规划并操作本地文件系统完成任务。

## Language

**Agent**:
用户设定目标后，自主规划步骤并代为执行的 AI 实体。运行在服务端（NestJS），通过 LLM 推理驱动循环。
_Avoid_: Bot, 机器人, 智能体

**任务（Task）**:
用户交给 Agent 的单一目标。Agent 将一个任务拆解为多个步骤，逐步执行。
_Avoid_: Job, 目标, Goal

**Agent 循环（Agent Loop）**:
思考 → 行动 → 观察 → 再思考的闭环。Agent 在每一步调用 LLM 决策下一步动作，执行后在观察结果的基础上继续推理。
_Avoid_: 推理链, Chain

**文件操作（File Operation）**:
Agent 对本地文件系统执行的动作，包括读取、写入、创建目录、删除文件等。由 Node.js fs 模块直接执行。
_Avoid_: IO, 磁盘操作
