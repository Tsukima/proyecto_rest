interface AllergenIconProps {
  allergen: string;
  size?: number;
}

export function AllergenIcon({ allergen, size = 32 }: AllergenIconProps) {
  const icons: { [key: string]: JSX.Element } = {
    "Gluten": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#E67E22"/>
        <path d="M50 20L48 35L50 50L52 35L50 20Z" fill="white"/>
        <path d="M50 50L45 40L42 35L38 40L42 45L50 50Z" fill="white"/>
        <path d="M50 50L55 40L58 35L62 40L58 45L50 50Z" fill="white"/>
        <path d="M50 50L45 60L42 70L38 65L42 55L50 50Z" fill="white"/>
        <path d="M50 50L55 60L58 70L62 65L58 55L50 50Z" fill="white"/>
      </svg>
    ),
    "Crustáceos": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#5DADE2"/>
        <path d="M50 35C45 35 40 38 40 42L45 45L50 42L55 45L60 42C60 38 55 35 50 35Z" fill="white"/>
        <ellipse cx="44" cy="40" rx="2" ry="3" fill="#2C3E50"/>
        <ellipse cx="56" cy="40" rx="2" ry="3" fill="#2C3E50"/>
        <path d="M35 50L40 48L42 52L38 55L35 50Z" fill="white"/>
        <path d="M65 50L60 48L58 52L62 55L65 50Z" fill="white"/>
        <path d="M50 45C55 45 58 48 58 52C58 56 55 65 50 65C45 65 42 56 42 52C42 48 45 45 50 45Z" fill="white"/>
      </svg>
    ),
    "Huevos": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#F39C12"/>
        <ellipse cx="42" cy="50" rx="10" ry="14" fill="white"/>
        <ellipse cx="58" cy="50" rx="10" ry="14" fill="white"/>
        <ellipse cx="50" cy="60" rx="8" ry="11" fill="white"/>
      </svg>
    ),
    "Huevo": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#F39C12"/>
        <ellipse cx="42" cy="50" rx="10" ry="14" fill="white"/>
        <ellipse cx="58" cy="50" rx="10" ry="14" fill="white"/>
        <ellipse cx="50" cy="60" rx="8" ry="11" fill="white"/>
      </svg>
    ),
    "Pescado": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#2E4C8B"/>
        <path d="M30 50C30 45 35 40 40 40C45 40 50 42 55 42C60 42 65 40 70 40L75 50L70 60C65 60 60 58 55 58C50 58 45 60 40 60C35 60 30 55 30 50Z" fill="white"/>
        <circle cx="42" cy="47" r="2" fill="#2E4C8B"/>
        <path d="M70 45L75 50L70 55L70 45Z" fill="white"/>
      </svg>
    ),
    "Cacahuetes": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#C19A6B"/>
        <path d="M40 45C38 45 35 47 35 50C35 53 38 55 40 55C42 55 45 53 45 50C45 47 42 45 40 45Z" fill="white"/>
        <path d="M60 45C58 45 55 47 55 50C55 53 58 55 60 55C62 55 65 53 65 50C65 47 62 45 60 45Z" fill="white"/>
        <ellipse cx="50" cy="58" rx="8" ry="5" fill="white"/>
      </svg>
    ),
    "Soja": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#82B366"/>
        <path d="M40 35C38 35 35 37 35 40L35 60C35 63 38 65 40 65L60 65C62 65 65 63 65 60L65 40C65 37 62 35 60 35L40 35Z" fill="white" stroke="white" strokeWidth="2"/>
        <circle cx="42" cy="45" r="3" fill="#82B366"/>
        <circle cx="50" cy="48" r="3" fill="#82B366"/>
        <circle cx="58" cy="45" r="3" fill="#82B366"/>
        <circle cx="46" cy="55" r="3" fill="#82B366"/>
        <circle cx="54" cy="55" r="3" fill="#82B366"/>
      </svg>
    ),
    "Lácteos": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#8B6F47"/>
        <path d="M40 35C38 35 35 37 35 40L35 50C35 52 36 54 38 55L38 65C38 67 40 70 43 70L57 70C60 70 62 67 62 65L62 55C64 54 65 52 65 50L65 40C65 37 62 35 60 35L40 35Z" fill="white"/>
        <rect x="42" y="38" width="16" height="8" rx="2" fill="#8B6F47"/>
      </svg>
    ),
    "Frutos de cáscara": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#E57373"/>
        <path d="M50 35C42 35 35 42 35 50C35 58 42 65 50 65C58 65 65 58 65 50C65 42 58 35 50 35Z" fill="white"/>
        <path d="M45 42L48 45L50 48L52 45L55 42" stroke="#E57373" strokeWidth="2" fill="none"/>
        <path d="M42 50L45 52L48 55L45 58L42 60" stroke="#E57373" strokeWidth="2" fill="none"/>
        <path d="M58 50L55 52L52 55L55 58L58 60" stroke="#E57373" strokeWidth="2" fill="none"/>
      </svg>
    ),
    "Frutos secos": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#E57373"/>
        <path d="M50 35C42 35 35 42 35 50C35 58 42 65 50 65C58 65 65 58 65 50C65 42 58 35 50 35Z" fill="white"/>
        <path d="M45 42L48 45L50 48L52 45L55 42" stroke="#E57373" strokeWidth="2" fill="none"/>
        <path d="M42 50L45 52L48 55L45 58L42 60" stroke="#E57373" strokeWidth="2" fill="none"/>
        <path d="M58 50L55 52L52 55L55 58L58 60" stroke="#E57373" strokeWidth="2" fill="none"/>
      </svg>
    ),
    "Apio": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#81C784"/>
        <rect x="48" y="50" width="4" height="20" rx="1" fill="white"/>
        <path d="M40 45C40 42 42 40 45 40C47 40 48 42 48 45L48 50L40 50L40 45Z" fill="white"/>
        <path d="M52 45C52 42 54 40 57 40C59 40 60 42 60 45L60 50L52 50L52 45Z" fill="white"/>
        <path d="M44 40C44 37 46 35 49 35C51 35 52 37 52 40L52 45L44 45L44 40Z" fill="white"/>
      </svg>
    ),
    "Mostaza": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#D4AC0D"/>
        <path d="M45 30L48 35L50 40L52 35L55 30C55 28 53 25 50 25C47 25 45 28 45 30Z" fill="white"/>
        <ellipse cx="50" cy="50" rx="12" ry="20" fill="white"/>
        <path d="M42 55C40 55 38 57 38 60C38 63 40 65 42 65L58 65C60 65 62 63 62 60C62 57 60 55 58 55L42 55Z" fill="white"/>
      </svg>
    ),
    "Sésamo": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#BDB76B"/>
        <ellipse cx="42" cy="42" rx="4" ry="6" fill="white" transform="rotate(-20 42 42)"/>
        <ellipse cx="58" cy="42" rx="4" ry="6" fill="white" transform="rotate(20 58 42)"/>
        <ellipse cx="50" cy="50" rx="4" ry="6" fill="white"/>
        <ellipse cx="38" cy="55" rx="4" ry="6" fill="white" transform="rotate(-30 38 55)"/>
        <ellipse cx="62" cy="55" rx="4" ry="6" fill="white" transform="rotate(30 62 55)"/>
      </svg>
    ),
    "Sulfitos": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#8E44AD"/>
        <path d="M35 45L40 40L45 45L50 40L55 45L60 40L65 45L65 55L60 60L55 55L50 60L45 55L40 60L35 55L35 45Z" fill="white"/>
        <text x="50" y="58" textAnchor="middle" fill="#8E44AD" fontSize="20" fontWeight="bold">E</text>
      </svg>
    ),
    "Altramuces": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#F4D03F"/>
        <circle cx="42" cy="45" r="7" fill="white"/>
        <circle cx="58" cy="45" r="7" fill="white"/>
        <circle cx="50" cy="58" r="7" fill="white"/>
      </svg>
    ),
    "Moluscos": (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#85C1E2"/>
        <path d="M50 30C42 30 35 35 35 42C35 48 40 54 45 58C47 60 50 62 50 62C50 62 53 60 55 58C60 54 65 48 65 42C65 35 58 30 50 30Z" fill="white"/>
        <path d="M40 42C40 40 42 38 45 38C48 38 50 40 50 42" stroke="#85C1E2" strokeWidth="1.5" fill="none"/>
        <path d="M50 42C50 40 52 38 55 38C58 38 60 40 60 42" stroke="#85C1E2" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  };

  return icons[allergen] || <div style={{ width: size, height: size }} />;
}
