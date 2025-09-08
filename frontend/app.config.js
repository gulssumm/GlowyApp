import 'dotenv/config';

export default {
  expo: {
    name: "Glowy App",
    slug: "glowy-app",
    version: "1.0.0",
    scheme: "glowyapp", 
    extra: {
      API_URL: process.env.API_URL,
      API_IMAGE_BASE_URL: process.env.API_IMAGE_BASE_URL
    },
  },
};
