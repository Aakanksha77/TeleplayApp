require('dotenv').config();

export default ({ config }) => ({
  ...config,
  projectId: "af525c89-a5e4-45dd-a6f4-e16245d56bb8", // ✅ Add projectId here
  extra: {
    ...config.extra, // preserve other extra fields
    BASE_URL: process.env.BASE_URL,
  },
});