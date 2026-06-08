import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      onClick={() => i18n.changeLanguage(isArabic ? 'en' : 'ar')}
      title={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      {isArabic ? 'English' : 'عربي'}
    </Button>
  )
}
