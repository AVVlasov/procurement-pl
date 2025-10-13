const pkg = require('./package')

module.exports = {
  apiPath: 'stubs/api',
  webpackConfig: {
    output: {
      publicPath: `/static/${pkg.name}/${process.env.VERSION || pkg.version}/`
    }
  },
  /* use https://admin.bro-js.ru/ to create config, navigations and features */
  navigations: {
    'procurement-pl.main': '/procurement-pl',
    'link.procurement-pl.auth': '/auth'
  },
  features: {
    'procurement-pl': {
      // add your features here in the format [featureName]: { value: string }
    },
  },
  config: {
    'procurement-pl.api': '/api'
  }
}
