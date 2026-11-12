import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'

import fr from '@nova/shared/i18n/fr'
import en from '@nova/shared/i18n/en'

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'fr'
const supportedLng = ['fr', 'en']
const lng = supportedLng.includes(deviceLocale) ? deviceLocale : 'fr'

const i18n = createInstance()

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

export default i18n
