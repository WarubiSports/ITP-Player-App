// Country to flag emoji mapping
export const getCountryFlag = (country) => {
    if (!country) return '🌍'

    const flags = {
        'Germany': '🇩🇪',
        'Austria': '🇦🇹',
        'Kenya': '🇰🇪',
        'France': '🇫🇷',
        'Spain': '🇪🇸',
        'Italy': '🇮🇹',
        'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        'Portugal': '🇵🇹',
        'Netherlands': '🇳🇱',
        'Belgium': '🇧🇪',
        'Brazil': '🇧🇷',
        'Argentina': '🇦🇷',
        'Poland': '🇵🇱',
        'Croatia': '🇭🇷',
        'Serbia': '🇷🇸',
        'Switzerland': '🇨🇭',
        'Denmark': '🇩🇰',
        'Sweden': '🇸🇪',
        'Norway': '🇳🇴',
        'Turkey': '🇹🇷',
        'USA': '🇺🇸',
        'Canada': '🇨🇦',
        'Japan': '🇯🇵',
        'South Korea': '🇰🇷',
        'Mexico': '🇲🇽',
        'Colombia': '🇨🇴',
        'Uruguay': '🇺🇾',
        'Chile': '🇨🇱',
        'Nigeria': '🇳🇬',
        'Ghana': '🇬🇭',
        'Senegal': '🇸🇳',
        'Ivory Coast': '🇨🇮',
        'Cameroon': '🇨🇲',
        'Morocco': '🇲🇦',
        'Egypt': '🇪🇬',
        'Algeria': '🇩🇿',
        'Tunisia': '🇹🇳',
        'South Africa': '🇿🇦',
        'Australia': '🇦🇺',
        'New Zealand': '🇳🇿',
        'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
        'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
        'Ireland': '🇮🇪',
        'Czech Republic': '🇨🇿',
        'Slovakia': '🇸🇰',
        'Hungary': '🇭🇺',
        'Romania': '🇷🇴',
        'Greece': '🇬🇷',
        'Ukraine': '🇺🇦',
        'Russia': '🇷🇺',
        'Finland': '🇫🇮',
        'Iceland': '🇮🇸',
        'Albania': '🇦🇱',
        'Bosnia': '🇧🇦',
        'Bulgaria': '🇧🇬',
        'Slovenia': '🇸🇮',
        // Additional countries for ITP players
        'UK': '🇬🇧',
        'United Kingdom': '🇬🇧',
        'India': '🇮🇳',
        'Peru': '🇵🇪',
        'Rwanda': '🇷🇼',
        'Uzbekistan': '🇺🇿',
        'Thailand': '🇹🇭',
        'China': '🇨🇳',
        'Philippines': '🇵🇭',
        'Vietnam': '🇻🇳',
        'Indonesia': '🇮🇩',
        'Malaysia': '🇲🇾',
        'Singapore': '🇸🇬',
        'Pakistan': '🇵🇰',
        'Bangladesh': '🇧🇩',
        'Sri Lanka': '🇱🇰',
        'Nepal': '🇳🇵',
        'Ecuador': '🇪🇨',
        'Venezuela': '🇻🇪',
        'Paraguay': '🇵🇾',
        'Bolivia': '🇧🇴',
        'Costa Rica': '🇨🇷',
        'Panama': '🇵🇦',
        'Honduras': '🇭🇳',
        'Guatemala': '🇬🇹',
        'Jamaica': '🇯🇲',
        'Trinidad': '🇹🇹',
        'Haiti': '🇭🇹',
        'Dominican Republic': '🇩🇴',
        'Puerto Rico': '🇵🇷',
    }

    // Handle dual nationalities (e.g., "USA/Thailand")
    if (country.includes('/')) {
        const countries = country.split('/')
        return countries.map(c => flags[c.trim()] || '🌍').join('')
    }

    return flags[country] || '🌍'
}

// Format date of birth to readable format
export const formatDateOfBirth = (dob) => {
    if (!dob) return 'N/A'
    const date = new Date(dob)
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

// Calculate age from date of birth
export const calculateAge = (dob) => {
    if (!dob) return 0
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }

    return age
}
