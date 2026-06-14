document.addEventListener('DOMContentLoaded', () => {
    // Detect active language
    const lang = document.documentElement.lang || 'tr';
    const isEN = lang === 'en';
    const pathPrefix = isEN ? '../' : '';

    // 0. Manual Light/Dark Theme Switcher
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('theme-toggle-sun');
    const moonIcon = document.getElementById('theme-toggle-moon');

    function updateThemeUI(theme) {
        if (theme === 'dark') {
            if (sunIcon) sunIcon.style.display = 'inline-block';
            if (moonIcon) moonIcon.style.display = 'none';
        } else {
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'inline-block';
        }
    }

    // Set initial icon state
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeUI(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeUI(newTheme);
        });
    }

    // 1. Dynamic Version Loading
    const fallbackVersion = '1.0.4';
    const repoBaseUrl = 'https://github.com/GorkemGuray/Namaz-App';

    const versionElements = document.querySelectorAll('.latest-version-name');
    const releaseNotesElement = document.querySelector('.release-notes-text');
    const mobileDownloadBtn = document.getElementById('mobile-download-btn');
    const wearDownloadBtn = document.getElementById('wear-download-btn');
    const changelogLink = document.getElementById('changelog-link');

    // Default URLs if API fails
    let appApkUrl = `${repoBaseUrl}/releases/latest`;
    let wearApkUrl = `${repoBaseUrl}/releases/latest`;

    fetch(pathPrefix + 'version.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const version = data.version;
            const cleanVersion = version.replace(/^v/, ''); // Ensure no duplicate v's
            const tag = `v${cleanVersion}`;

            // Update version names
            versionElements.forEach(el => {
                el.textContent = tag;
            });

            // Update release notes
            if (releaseNotesElement) {
                releaseNotesElement.textContent = isEN 
                    ? (data.releaseNotesEN || data.releaseNotes) 
                    : data.releaseNotes;
            }

            // Construct direct asset download URLs
            appApkUrl = `${repoBaseUrl}/releases/download/${tag}/Namaz-${cleanVersion}-app-debug.apk`;
            wearApkUrl = `${repoBaseUrl}/releases/download/${tag}/Namaz-${cleanVersion}-wear-debug.apk`;

            // Update download button URLs
            if (mobileDownloadBtn) mobileDownloadBtn.href = appApkUrl;
            if (wearDownloadBtn) wearDownloadBtn.href = wearApkUrl;
            if (changelogLink) changelogLink.href = `${repoBaseUrl}/releases/tag/${tag}`;
        })
        .catch(error => {
            console.error('Error fetching version.json, using fallback values:', error);
            versionElements.forEach(el => {
                el.textContent = `v${fallbackVersion}`;
            });
            if (releaseNotesElement) {
                releaseNotesElement.textContent = isEN 
                    ? "Failed to load release notes." 
                    : "Sürüm bilgileri yüklenemedi.";
            }
            if (mobileDownloadBtn) mobileDownloadBtn.href = `${repoBaseUrl}/releases/latest`;
            if (wearDownloadBtn) wearDownloadBtn.href = `${repoBaseUrl}/releases/latest`;
        });

    // 2. Interactive Screenshot Gallery for Phone Mockup
    const sliderImages = [
        'app_screenshot_home.webp',
        'app_screenshot_qibla.webp',
        'app_screenshot_calendar.webp',
        'app_screenshot_zikirmatik.webp'
    ];

    const screenImg = document.getElementById('phone-screen-img');
    const dots = document.querySelectorAll('.gallery-dot');
    const titles = document.querySelectorAll('.feature-indicator');

    function switchScreen(index) {
        if (!screenImg) return;
        
        // Add fade-out transition
        screenImg.style.opacity = '0';
        
        setTimeout(() => {
            screenImg.src = pathPrefix + sliderImages[index];
            screenImg.style.opacity = '1';
        }, 200);

        // Update active dot
        dots.forEach((dot, idx) => {
            if (idx === index) {
                dot.classList.add('active');
                dot.setAttribute('aria-selected', 'true');
            } else {
                dot.classList.remove('active');
                dot.setAttribute('aria-selected', 'false');
            }
        });

        // Update active text indicator
        titles.forEach((title, idx) => {
            if (idx === index) {
                title.classList.add('active');
            } else {
                title.classList.remove('active');
            }
        });
    }

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => switchScreen(idx));
    });

    titles.forEach((title, idx) => {
        title.addEventListener('click', () => switchScreen(idx));
    });

    // Auto rotate screen previews every 6 seconds
    let currentIndex = 0;
    let autoPlayInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % sliderImages.length;
        switchScreen(currentIndex);
    }, 6000);

    // Stop auto play on user interaction
    const stopAutoPlay = () => {
        clearInterval(autoPlayInterval);
    };

    dots.forEach(dot => dot.addEventListener('click', stopAutoPlay));
    titles.forEach(title => title.addEventListener('click', stopAutoPlay));

    // ==========================================================================
    // 3. Canlı Namaz Vakitleri Widget Entegrasyonu
    // ==========================================================================
    const widgetLocationName = document.getElementById('widget-location-name');
    const widgetHijriDate = document.getElementById('widget-hijri-date');
    const widgetGregorianDate = document.getElementById('widget-gregorian-date');
    const widgetCountdownTimer = document.getElementById('widget-countdown-timer');
    const widgetNextPrayerName = document.getElementById('widget-next-prayer-name');
    const widgetProgressFill = document.getElementById('widget-progress-fill');
    const widgetSearchForm = document.getElementById('widget-search-form');
    const widgetSearchInput = document.getElementById('widget-search-input');
    const widgetGpsBtn = document.getElementById('widget-gps-btn');
    
    // Focus Card elements
    const prayerFocusCard = document.getElementById('prayer-focus-card');
    const focusTitleText = document.getElementById('focus-title-text');
    const focusTimeValue = document.getElementById('focus-time-value');
    const focusMetaText = document.getElementById('focus-meta-text');

    const prayerCards = {
        imsak: document.getElementById('card-imsak'),
        gunes: document.getElementById('card-gunes'),
        ogle: document.getElementById('card-ogle'),
        ikindi: document.getElementById('card-ikindi'),
        aksam: document.getElementById('card-aksam'),
        yatsi: document.getElementById('card-yatsi')
    };

    const prayerValues = {
        imsak: document.getElementById('val-imsak'),
        gunes: document.getElementById('val-gunes'),
        ogle: document.getElementById('val-ogle'),
        ikindi: document.getElementById('val-ikindi'),
        aksam: document.getElementById('val-aksam'),
        yatsi: document.getElementById('val-yatsi')
    };

    let currentPrayerTimes = null;
    let timerInterval = null;
    let defaultCity = isEN ? "London" : "İstanbul";
    let defaultLat = isEN ? 51.5074 : 41.0082;
    let defaultLon = isEN ? -0.1278 : 28.9784;

    // Localized Prayer Names
    const prayerNamesTR = {
        Fajr: "Sabah (İmsak)",
        Sunrise: "Güneş",
        Dhuhr: "Öğle",
        Asr: "İkindi",
        Maghrib: "Akşam",
        Isha: "Yatsı"
    };
    const prayerNamesEN = {
        Fajr: "Fajr",
        Sunrise: "Sunrise",
        Dhuhr: "Dhuhr",
        Asr: "Asr",
        Maghrib: "Maghrib",
        Isha: "Isha"
    };
    const prayerNames = isEN ? prayerNamesEN : prayerNamesTR;

    // Hijri Month Dictionaries
    const hijriMonthsTR = {
        1: "Muharrem", 2: "Safer", 3: "Rebiülevvel", 4: "Rebiülahir",
        5: "Cemaziyelevvel", 6: "Cemaziyelahir", 7: "Recep", 8: "Şaban",
        9: "Ramazan", 10: "Şevval", 11: "Zilkade", 12: "Zilhicce"
    };
    const hijriMonthsEN = {
        1: "Muharram", 2: "Safar", 3: "Rabi' al-awwal", 4: "Rabi' al-thani",
        5: "Jumada al-awwal", 6: "Jumada al-thani", 7: "Rajab", 8: "Sha'ban",
        9: "Ramadan", 10: "Shawwal", 11: "Dhu al-Qadah", 12: "Dhu al-Hijjah"
    };

    // Search Messages
    const messages = {
        searching: isEN ? "Searching location..." : "Konum aranıyor...",
        gpsRetrieving: isEN ? "Retrieving GPS coordinates..." : "GPS koordinatları alınıyor...",
        gpsError: isEN ? "Location permission denied or retrieval failed. You can search manually." : "Konum izni reddedildi veya konum alınamadı. Arama kutusunu kullanabilirsiniz.",
        gpsNotSupported: isEN ? "Your browser does not support GPS location." : "Tarayıcınız GPS konumunu desteklemiyor.",
        notFound: isEN ? "Location not found. Please try again." : "Konum bulunamadı. Lütfen tekrar deneyin.",
        loadFailed: isEN ? "Times could not be loaded" : "Vakit yüklenemedi"
    };

    // Query parameters mappings (both English and Turkish terms)
    const urlVakitKeys = {
        sabah: "Fajr",
        imsak: "Fajr",
        fajr: "Fajr",
        gunes: "Sunrise",
        sunrise: "Sunrise",
        ogle: "Dhuhr",
        dhuhr: "Dhuhr",
        ikindi: "Asr",
        asr: "Asr",
        aksam: "Maghrib",
        maghrib: "Maghrib",
        yatsi: "Isha",
        isha: "Isha"
    };

    // 3.1 Vakitleri Aladhan API'den Getir
    function fetchPrayerTimes(lat, lon, cityName, targetVakit = null) {
        if (widgetLocationName) widgetLocationName.textContent = `${cityName}...`;
        
        // Aladhan API parameters: method 13 (Turkey Diyanet)
        const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=13`;
        
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error("API error");
                return res.json();
            })
            .then(resData => {
                const data = resData.data;
                const timings = data.timings;
                
                currentPrayerTimes = {
                    imsak: timings.Fajr,
                    gunes: timings.Sunrise,
                    ogle: timings.Dhuhr,
                    ikindi: timings.Asr,
                    aksam: timings.Maghrib,
                    yatsi: timings.Isha
                };

                // UI değerlerini doldur
                for (const key in prayerValues) {
                    if (prayerValues[key] && currentPrayerTimes[key]) {
                        prayerValues[key].textContent = currentPrayerTimes[key];
                    }
                }

                // Localized Hijri Date Display
                if (widgetHijriDate) {
                    const hijri = data.date.hijri;
                    const monthNum = parseInt(hijri.month.number);
                    const monthName = isEN ? hijriMonthsEN[monthNum] : hijriMonthsTR[monthNum];
                    widgetHijriDate.textContent = `${hijri.day} ${monthName} ${hijri.year}`;
                }
                
                // Localized Gregorian Date Display
                if (widgetGregorianDate) {
                    const timestampMs = parseInt(data.date.timestamp) * 1000;
                    const dateObj = new Date(timestampMs);
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    widgetGregorianDate.textContent = dateObj.toLocaleDateString(isEN ? 'en-US' : 'tr-TR', options);
                }

                if (widgetLocationName) {
                    widgetLocationName.textContent = cityName;
                }

                // Geri sayımı ve aktif vakit vurgusunu başlat
                startCountdown(timings);

                // Eğer vakit + konum odaklı SEO araması ise Arama Odak Kartını doldur ve göster
                handleSEOFocus(cityName, timings, targetVakit);
            })
            .catch(err => {
                console.error("Vakitler yüklenemedi:", err);
                if (widgetLocationName) widgetLocationName.textContent = `${cityName} (${messages.loadFailed})`;
            });
    }

    // 3.2 Geri Sayım Sayacı ve Aktif Vakit Vurgusu
    function startCountdown(timings) {
        if (timerInterval) clearInterval(timerInterval);

        function updateTimer() {
            const now = new Date();
            const nowMs = now.getTime();

            // Vakit saatlerini bugünün Date objesine map'leme
            const times = {
                imsak: parseTimeToDate(timings.Fajr),
                gunes: parseTimeToDate(timings.Sunrise),
                ogle: parseTimeToDate(timings.Dhuhr),
                ikindi: parseTimeToDate(timings.Asr),
                aksam: parseTimeToDate(timings.Maghrib),
                yatsi: parseTimeToDate(timings.Isha)
            };

            // Yarının imsak vaktini de hesapla (Yatsıdan sonra imsağa saymak için)
            const tomorrowImsak = new Date(times.imsak);
            tomorrowImsak.setDate(tomorrowImsak.getDate() + 1);

            let activeKey = null;
            let nextKey = null;
            let nextTime = null;
            let prevTime = null;

            if (nowMs < times.imsak.getTime()) {
                activeKey = "yatsi"; // Dünden kalan yatsı vaktindeyiz
                nextKey = "imsak";
                nextTime = times.imsak;
                // Dünün yatsı vaktini hesapla
                const yesterdayYatsi = new Date(times.yatsi);
                yesterdayYatsi.setDate(yesterdayYatsi.getDate() - 1);
                prevTime = yesterdayYatsi;
            } else if (nowMs < times.gunes.getTime()) {
                activeKey = "imsak";
                nextKey = "gunes";
                nextTime = times.gunes;
                prevTime = times.imsak;
            } else if (nowMs < times.ogle.getTime()) {
                activeKey = "gunes";
                nextKey = "ogle";
                nextTime = times.ogle;
                prevTime = times.gunes;
            } else if (nowMs < times.ikindi.getTime()) {
                activeKey = "ogle";
                nextKey = "ikindi";
                nextTime = times.ikindi;
                prevTime = times.ogle;
            } else if (nowMs < times.aksam.getTime()) {
                activeKey = "ikindi";
                nextKey = "aksam";
                nextTime = times.aksam;
                prevTime = times.ikindi;
            } else if (nowMs < times.yatsi.getTime()) {
                activeKey = "aksam";
                nextKey = "yatsi";
                nextTime = times.yatsi;
                prevTime = times.aksam;
            } else {
                activeKey = "yatsi";
                nextKey = "imsak";
                nextTime = tomorrowImsak;
                prevTime = times.yatsi;
            }

            // Aktif vakit kartını UI'da işaretle
            for (const key in prayerCards) {
                if (prayerCards[key]) {
                    if (key === activeKey) {
                        prayerCards[key].classList.add('active');
                    } else {
                        prayerCards[key].classList.remove('active');
                    }
                }
            }

            // Geri sayım hesaplama
            const diff = nextTime.getTime() - nowMs;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Timer format: HH:MM:SS
            const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            if (widgetCountdownTimer) widgetCountdownTimer.textContent = formattedTime;

            // Sıradaki vakit ismini yaz
            if (widgetNextPrayerName) {
                widgetNextPrayerName.textContent = prayerNames[nextKey === "imsak" ? "Fajr" : (nextKey === "gunes" ? "Sunrise" : (nextKey === "ogle" ? "Dhuhr" : (nextKey === "ikindi" ? "Asr" : (nextKey === "aksam" ? "Maghrib" : "Isha"))))];
            }

            // İlerleme barı
            const totalDuration = nextTime.getTime() - prevTime.getTime();
            const elapsed = nowMs - prevTime.getTime();
            const percent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            if (widgetProgressFill) widgetProgressFill.style.width = `${percent}%`;
        }

        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    function parseTimeToDate(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        return d;
    }

    // 3.3 Nominatim Geocoding API ile Konum Arama
    function searchLocation(query, targetVakit = null, updateUrl = false) {
        if (!query) return;
        // Replace hyphens with spaces for better OSM search compatibility (e.g. "silivri-istanbul" -> "silivri istanbul")
        const cleanQuery = query.replace(/-/g, ' ').trim();
        const acceptLanguage = isEN ? 'en' : 'tr';
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&limit=1&accept-language=${acceptLanguage}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    const result = data[0];
                    const lat = parseFloat(result.lat);
                    const lon = parseFloat(result.lon);
                    
                    // Şehir adı temizleme
                    const parts = result.display_name.split(',');
                    let cleanName = parts[0];
                    if (parts.length > 1 && isNaN(parts[1].trim())) {
                        cleanName += `, ${parts[1].trim()}`;
                    }

                    fetchPrayerTimes(lat, lon, cleanName, targetVakit);

                    // URL'i güncelle
                    if (updateUrl) {
                        const queryCityKey = isEN ? 'city' : 'sehir';
                        const queryPrayerKey = isEN ? 'prayer' : 'vakit';
                        const newUrl = targetVakit 
                            ? `?${queryCityKey}=${encodeURIComponent(cleanQuery.toLowerCase())}&${queryPrayerKey}=${encodeURIComponent(targetVakit.toLowerCase())}`
                            : `?${queryCityKey}=${encodeURIComponent(cleanQuery.toLowerCase())}`;
                        window.history.pushState({ path: newUrl }, '', newUrl);
                        updateSEOMetadata(cleanQuery, targetVakit);
                    }
                } else {
                    alert(messages.notFound);
                }
            })
            .catch(err => {
                console.error("Geocoding hatası:", err);
            });
    }

    // 3.4 IP ile Otomatik Konum Belirleme (ipapi.co HTTPS)
    function autoDetectLocation(targetVakit = null) {
        fetch('https://ipapi.co/json/')
            .then(res => {
                if (!res.ok) throw new Error("IP API failed");
                return res.json();
            })
            .then(data => {
                if (data.latitude && data.longitude) {
                    const cityName = `${data.city}, ${data.country_name}`;
                    fetchPrayerTimes(data.latitude, data.longitude, cityName, targetVakit);
                } else {
                    // Fallback
                    fetchPrayerTimes(defaultLat, defaultLon, defaultCity, targetVakit);
                }
            })
            .catch(() => {
                // Fallback on block/fail
                fetchPrayerTimes(defaultLat, defaultLon, defaultCity, targetVakit);
            });
    }

    // 3.5 GPS Konumu Alma
    if (widgetGpsBtn) {
        widgetGpsBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                if (widgetLocationName) widgetLocationName.textContent = messages.gpsRetrieving;
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        
                        // Reverse geocode lat/lon to get actual location name
                        const acceptLanguage = isEN ? 'en' : 'tr';
                        const reverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${acceptLanguage}`;
                        
                        fetch(reverseUrl)
                            .then(res => res.json())
                            .then(data => {
                                let locationName = isEN ? "GPS Location" : "GPS Konumu";
                                if (data && data.address) {
                                    const addr = data.address;
                                    const district = addr.district || addr.suburb || addr.town || addr.village || addr.city_district;
                                    const city = addr.city || addr.province || addr.state;
                                    const country = addr.country;
                                    if (district && city) {
                                        locationName = `${district}, ${city}`;
                                    } else if (city) {
                                        locationName = country ? `${city}, ${country}` : city;
                                    } else if (district) {
                                        locationName = country ? `${district}, ${country}` : district;
                                    } else if (data.display_name) {
                                        locationName = data.display_name.split(',')[0];
                                    }
                                }
                                fetchPrayerTimes(lat, lon, locationName, null);
                            })
                            .catch(err => {
                                console.error("Reverse geocoding error, using fallback label:", err);
                                const fallbackLabel = isEN ? "GPS Location" : "GPS Konumu";
                                fetchPrayerTimes(lat, lon, fallbackLabel, null);
                            });
                    },
                    err => {
                        console.error("GPS hatası:", err);
                        alert(messages.gpsError);
                        autoDetectLocation(null);
                    }
                );
            } else {
                alert(messages.gpsNotSupported);
            }
        });
    }

    // 3.6 Form submit ile arama
    if (widgetSearchForm) {
        widgetSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (widgetSearchInput) {
                const query = widgetSearchInput.value.trim();
                if (query) {
                    searchLocation(query, null, true);
                }
            }
        });
    }

    // 3.7 Dinamik SEO Güncelleme ve Arama Odak Kartı
    function handleSEOFocus(cityName, timings, targetVakit) {
        if (!targetVakit) {
            if (prayerFocusCard) prayerFocusCard.style.display = 'none';
            // Grid'deki focused/active sınıflarını temizle
            for (const key in prayerCards) {
                if (prayerCards[key]) prayerCards[key].classList.remove('focused');
            }
            return;
        }

        const standardVakitKey = urlVakitKeys[targetVakit.toLowerCase()];
        if (!standardVakitKey) return;

        let vakitName = "";
        if (isEN) {
            vakitName = prayerNamesEN[standardVakitKey];
        } else {
            vakitName = targetVakit.toLowerCase() === 'sabah' ? 'Sabah' : prayerNamesTR[standardVakitKey];
        }

        const timeValue = timings[standardVakitKey];
        const focusCardId = `card-${standardVakitKey.toLowerCase() === 'fajr' ? 'imsak' : (standardVakitKey.toLowerCase() === 'sunrise' ? 'gunes' : (standardVakitKey.toLowerCase() === 'dhuhr' ? 'ogle' : (standardVakitKey.toLowerCase() === 'asr' ? 'ikindi' : (standardVakitKey.toLowerCase() === 'maghrib' ? 'aksam' : 'yatsi'))))}`;

        // Focus grid card highlight
        for (const key in prayerCards) {
            if (prayerCards[key]) {
                if (prayerCards[key].id === focusCardId) {
                    prayerCards[key].classList.add('focused');
                } else {
                    prayerCards[key].classList.remove('focused');
                }
            }
        }

        // Focus card UI update
        if (prayerFocusCard && focusTitleText && focusTimeValue && focusMetaText) {
            prayerFocusCard.style.display = 'flex';
            
            // Format nice text
            const cleanCityName = cityName.split(',')[0].trim();
            focusTimeValue.textContent = timeValue;
            
            if (isEN) {
                focusTitleText.textContent = `${cleanCityName} ${vakitName} Prayer Time`;
                if (standardVakitKey === 'Fajr') {
                    focusMetaText.textContent = `Today's Fajr prayer begins at this time. The Fajr prayer can be performed until Sunrise at ${timings.Sunrise}.`;
                } else if (standardVakitKey === 'Maghrib') {
                    focusMetaText.textContent = `Maghrib prayer starts at this time. This is also the time to break the daily fast (Iftar).`;
                } else {
                    focusMetaText.textContent = `Today's ${vakitName} prayer starts at this time.`;
                }
            } else {
                focusTitleText.textContent = `${cleanCityName} ${vakitName} Namazı Vakti`;
                if (standardVakitKey === 'Fajr') {
                    focusMetaText.textContent = `Bugün sabah ezanı bu saatte okunur. Sabah namazı kılınabilecek son sınır Güneş doğuş saati ise ${timings.Sunrise} vaktidir.`;
                } else if (standardVakitKey === 'Maghrib') {
                    focusMetaText.textContent = `Akşam ezanı bu saatte okunur. Aynı zamanda bugünkü iftar (oruç açma) saatidir.`;
                } else {
                    focusMetaText.textContent = `Bugün ${vakitName.toLowerCase()} namazı ezanı bu saatte okunmaktadır.`;
                }
            }

            // Scroll widget into view
            setTimeout(() => {
                const liveVakitSection = document.getElementById('live-vakit');
                if (liveVakitSection) {
                    liveVakitSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        }
    }

    // Dynamic Canonical URL Update
    function updateCanonical(cityName = null, targetVakit = null) {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        
        const baseUrl = isEN 
            ? "https://gorkemguray.github.io/Namaz-App/en/" 
            : "https://gorkemguray.github.io/Namaz-App/";
            
        if (cityName) {
            const queryCityKey = isEN ? 'city' : 'sehir';
            const queryPrayerKey = isEN ? 'prayer' : 'vakit';
            const queryStr = targetVakit 
                ? `?${queryCityKey}=${encodeURIComponent(cityName.toLowerCase())}&${queryPrayerKey}=${encodeURIComponent(targetVakit.toLowerCase())}`
                : `?${queryCityKey}=${encodeURIComponent(cityName.toLowerCase())}`;
            canonical.href = baseUrl + queryStr;
        } else {
            canonical.href = baseUrl;
        }
    }

    // Dynamic document metadata update
    function updateSEOMetadata(cityName, targetVakit) {
        const cleanCityName = cityName.trim().charAt(0).toUpperCase() + cityName.trim().slice(1);
        let title = "";
        let desc = "";
        let h1Text = "";

        updateCanonical(cityName, targetVakit);

        if (isEN) {
            if (targetVakit) {
                const standardVakitKey = urlVakitKeys[targetVakit.toLowerCase()];
                const vakitName = prayerNamesEN[standardVakitKey];
                title = `When is ${vakitName} Prayer in ${cleanCityName}? Today's ${vakitName} Adhan Time`;
                desc = `Get today's Fajr, Sunrise, Dhuhr, Asr, Maghrib, and Isha prayer times for ${cleanCityName}. Ad-free prayer times calculation.`;
                h1Text = `${cleanCityName} ${vakitName} Prayer Time`;
            } else {
                title = `${cleanCityName} Prayer Times - Adhan Clock`;
                desc = `Today's daily prayer times, Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha times for ${cleanCityName} and countdown to next prayer.`;
                h1Text = `${cleanCityName} Prayer Times`;
            }

            // Apply metadata updates
            document.title = `${title} — Namaz Vakitleri`;
            
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', desc);

            // Update main hero header dynamically
            const heroTitle = document.querySelector('.hero-title');
            if (heroTitle) {
                heroTitle.innerHTML = `${h1Text} <span>Simple & Ad-Free.</span>`;
            }
        } else {
            if (targetVakit) {
                const standardVakitKey = urlVakitKeys[targetVakit.toLowerCase()];
                const vakitNameTR = targetVakit.toLowerCase() === 'sabah' ? 'Sabah' : prayerNamesTR[standardVakitKey];
                
                title = `${cleanCityName} ${vakitNameTR} Namazı Kaçta? bugünün ${vakitNameTR} Ezanı Saati ve Vakti`;
                desc = `${cleanCityName} için bugünkü sabah, imsak, güneş, öğle, ikindi, akşam veya yatsı ezanı saati ve vakti. Reklamsız namaz vakitleri sorgulama.`;
                h1Text = `${cleanCityName} ${vakitNameTR} Namazı Vakti`;
            } else {
                title = `${cleanCityName} Namaz Vakitleri - Ezan Saatleri`;
                desc = `${cleanCityName} için bugünkü günlük namaz vakitleri, imsak, sabah, öğle, ikindi, akşam, yatsı saatleri ve sıradaki ezana kalan süre.`;
                h1Text = `${cleanCityName} Namaz Vakitleri`;
            }

            // Apply metadata updates
            document.title = `${title} — Namaz Vakitleri`;
            
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', desc);

            // Update main hero header dynamically
            const heroTitle = document.querySelector('.hero-title');
            if (heroTitle) {
                heroTitle.innerHTML = `${h1Text} <span>Sade ve Reklamsız.</span>`;
            }
        }
    }

    // 3.8 URL Parametrelerini Çözümleme ve Başlatma
    function initWidget() {
        const params = new URLSearchParams(window.location.search);
        const sehirParam = params.get('sehir') || params.get('city');
        const vakitParam = params.get('vakit') || params.get('prayer');

        if (sehirParam) {
            const decodedCity = decodeURIComponent(sehirParam);
            searchLocation(decodedCity, vakitParam, false);
            updateSEOMetadata(decodedCity, vakitParam);
            if (widgetSearchInput) {
                widgetSearchInput.value = decodedCity.charAt(0).toUpperCase() + decodedCity.slice(1);
            }
        } else {
            autoDetectLocation(null);
        }
    }

    // Initialize Widget
    initWidget();

    // 3.9 SEO Linklerinin yenilemesiz geçişini sağlama
    const seoLinks = document.querySelectorAll('.seo-link');
    seoLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
                const params = new URLSearchParams(href.substring(1)); // Remove '?'
                const sehir = params.get('sehir') || params.get('city');
                const vakit = params.get('vakit') || params.get('prayer');
                
                if (sehir) {
                    searchLocation(sehir, vakit, true);
                    
                    // Fill input value for consistency
                    if (widgetSearchInput) {
                        widgetSearchInput.value = sehir.charAt(0).toUpperCase() + sehir.slice(1);
                    }
                }
            }
        });
    });
});
