module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      if (env === 'production') {
        // Remove all webpack-dev-server entries
        if (webpackConfig.entry) {
          if (Array.isArray(webpackConfig.entry)) {
            webpackConfig.entry = webpackConfig.entry.filter(entry => 
              !entry.includes('webpack-dev-server') && 
              !entry.includes('react-refresh') &&
              !entry.includes('webpackHotDevClient')
            );
          }
        }
        
        // Remove HMR plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          const name = plugin.constructor.name;
          return !name.includes('HotModuleReplacementPlugin') && 
                 !name.includes('ReactRefreshPlugin') &&
                 !name.includes('CaseSensitivePathsPlugin') &&
                 !name.includes('WatchMissingNodeModulesPlugin');
        });
        
        // Disable dev server completely
        delete webpackConfig.devServer;
        
        // Ensure optimization
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimize: true,
          nodeEnv: 'production'
        };
      }
      
      return webpackConfig;
    }
  }
};