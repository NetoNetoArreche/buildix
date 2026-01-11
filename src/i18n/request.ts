import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

// Import locale files directly to avoid dynamic import caching issues
import enMessages from './locales/en.json';
import ptBRMessages from './locales/pt-BR.json';
import esMessages from './locales/es.json';

const messages: Record<Locale, typeof enMessages> = {
  'en': enMessages,
  'pt-BR': ptBRMessages,
  'es': esMessages,
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value as Locale | undefined;

  // Validate locale from cookie
  const locale = cookieLocale && locales.includes(cookieLocale)
    ? cookieLocale
    : defaultLocale;

  return {
    locale,
    messages: messages[locale]
  };
});
