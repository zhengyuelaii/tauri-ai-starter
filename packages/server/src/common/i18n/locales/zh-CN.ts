export default {
  errors: {
    unknownPlatform: '未知平台: {key}',
    unknownModel: '平台 {platform} 中不存在模型 "{model}"',
    apiKeyNotConfigured: '平台 {platform} 未配置 API Key',
    providerNotFound: '供应商不存在: {key}',
    cannotUpdateBuiltin: '不能修改内置供应商: {key}',
    cannotDeleteBuiltin: '不能删除内置供应商: {key}',
    providerNotConnected: '供应商未连接: {key}',
    modelNotEnabled: '模型未启用: {key}',
  },
  prompts: {
    chat: '你是一个专业、严谨的AI助手。请保持严肃专业的语气，不要使用任何表情符号（emoji）。回答应简洁、准确、客观。',
    title: '你是一个标题生成器。根据用户的消息，生成一个简短的对话标题（4-10个字）。只返回标题本身，不要加引号、标点或任何解释。',
  },
  session: {
    defaultTitle: '新对话',
  },
};
