export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  siliconflowApiKey:
    process.env.SILICONFLOW_API_KEY ??
    process.env.NUXT_SILICONFLOW_API_KEY ??
    '',
  deepseekApiKey:
    process.env.DEEPSEEK_API_KEY ??
    process.env.NUXT_DEEPSEEK_API_KEY ??
    '',
});
