import { getNavigation, getNavigationValue, getConfigValue } from '@brojs/cli'

import pkg from '../../package.json'

const baseUrl = getNavigationValue(`${pkg.name}.main`)
const navs = getNavigation()
const makeUrl = (url) => baseUrl + url
const apiUrl = getConfigValue(`${pkg.name}.api`)

export const URLs = {
  baseUrl,
  apiUrl,
  auth: {
    login: {
      url: makeUrl(navs[`link.${pkg.name}.auth.login`]),
      isOn: Boolean(navs[`link.${pkg.name}.auth.login`])
    },
    register: {
      url: makeUrl(navs[`link.${pkg.name}.auth.register`]),
      isOn: Boolean(navs[`link.${pkg.name}.auth.register`])
    }
  },
  dashboard: {
    url: makeUrl(navs[`link.${pkg.name}.dashboard`]),
    isOn: Boolean(navs[`link.${pkg.name}.dashboard`])
  },
  company: {
    url: makeUrl(navs[`link.${pkg.name}.company`]),
    isOn: Boolean(navs[`link.${pkg.name}.company`])
  },
  search: {
    url: makeUrl(navs[`link.${pkg.name}.search`]),
    isOn: Boolean(navs[`link.${pkg.name}.search`])
  }
}
