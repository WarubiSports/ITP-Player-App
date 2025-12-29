// Country to flag emoji mapping
export const getCountryFlag = (country) => {
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
