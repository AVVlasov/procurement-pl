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
    'procurement-pl.main': '/',
    'link.procurement-pl.auth.login': '/auth/login',
    'link.procurement-pl.auth.register': '/auth/register',
    'link.procurement-pl.dashboard': '/dashboard',
    'link.procurement-pl.company': '/company/:id',
    'link.procurement-pl.search': '/search'
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
