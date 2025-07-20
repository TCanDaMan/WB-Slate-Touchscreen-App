module.exports = function override(config, env) {
  if (env === 'production') {
    // Remove all webpack-dev-server related plugins
    config.plugins = config.plugins.filter(plugin => {
      const name = plugin.constructor.name;
      return !name.includes('HotModuleReplacement') && 
             !name.includes('ReactRefresh') &&
             !name.includes('WatchMissing');
    });
    
    // Remove dev server entries
    if (config.entry) {
      if (Array.isArray(config.entry)) {
        config.entry = config.entry.filter(entry => 
          !entry.includes('webpack-dev-server') && 
          !entry.includes('react-refresh')
        );
      }
    }
    
    // Disable devServer completely
    delete config.devServer;
    
    // Remove any HMR or dev-related optimizations
    if (config.optimization) {
      delete config.optimization.runtimeChunk;
    }
  }
  
  return config;
};