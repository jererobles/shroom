

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-docs"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  viteFinal: async (config) => {
    // Remove the problematic aliases from the main vite config
    if (config.resolve?.alias) {
      delete config.resolve.alias.buffer;
      delete config.resolve.alias.timers;
    }
    
    return config;
  }
};
export default config;