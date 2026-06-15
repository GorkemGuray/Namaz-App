#!/usr/bin/env python3
"""
SEO Static Page Generator for Namaz Vakitleri
Reads sitemap city lists, generates prerendered HTML files per city.
Each file has unique <title>, <meta description>, <h1>, canonical, JSON-LD.
Prayer time VALUES are still JS-filled (app.js), but the page structure
is now unique per city → no duplicate content penalty from Google.

Usage: python3 website/generate_static.py
"""

import xml.etree.ElementTree as ET
import os, json
from datetime import date

BASE_URL_TR = "https://gorkemguray.github.io/Namaz-App"
BASE_URL_EN = "https://gorkemguray.github.io/Namaz-App/en"
TODAY = date.today().isoformat()
WEBSITE_DIR = os.path.dirname(os.path.abspath(__file__))


def load_cities(sitemap_file):
    """Extract city parameter values from sitemap XML (clean URL format)."""
    tree = ET.parse(sitemap_file)
    root = tree.getroot()
    ns = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
    cities = []
    for url in root.findall(f'{ns}url'):
        loc = url.find(f'{ns}loc').text
        priority = url.find(f'{ns}priority')
        p = priority.text if priority is not None else '0.6'
        for prefix, suffix in [('/sehir/', '/'), ('/city/', '/')]:
            if prefix in loc:
                rest = loc.split(prefix)[1]
                param = rest.rstrip(suffix)
                cities.append((param, p))
                break
    return cities


def city_display_name(param):
    """Convert URL param to readable city name."""
    if '-' in param:
        parts = param.split('-')
        return f"{parts[0].title()}, {parts[1].title()}"
    return param.title()


def tr_title_case(text):
    """Turkish-aware title case."""
    if not text:
        return text
    tr_upper = {'i': 'İ', 'ı': 'I', 'ğ': 'Ğ', 'ü': 'Ü', 'ş': 'Ş', 'ö': 'Ö', 'ç': 'Ç'}
    first = text[0]
    if first.lower() in tr_upper:
        first = tr_upper[first.lower()]
    else:
        first = first.upper()
    return first + text[1:]


def json_ld_city(name_tr, url, is_en=False):
    """Generate JSON-LD for a city page. No fake ratings."""
    if is_en:
        return {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": f"{city_display_name(name_tr)} Prayer Times",
            "url": url,
            "description": f"Today's daily prayer times for {city_display_name(name_tr)}. Fajr, Dhuhr, Asr, Maghrib, Isha adhan clock.",
            "applicationCategory": "LifestyleApplication",
            "operatingSystem": "Web",
            "about": {"@type": "Place", "name": city_display_name(name_tr)}
        }
    else:
        return {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": f"{tr_title_case(name_tr.split('-')[0])} Namaz Vakitleri",
            "url": url,
            "description": f"{tr_title_case(name_tr.split('-')[0])} için bugünkü günlük namaz vakitleri, imsak, sabah, öğle, ikindi, akşam, yatsı saatleri.",
            "applicationCategory": "LifestyleApplication",
            "operatingSystem": "Web",
            "about": {"@type": "Place", "name": city_display_name(name_tr), "containedInPlace": {"@type": "Country", "name": "Türkiye"}}
        }


GA4_ID = "G-XXXXXXXXXX"  # Replace with real ID


def og_tags(title, desc, url, image, locale):
    """Generate Open Graph + Twitter Card meta tags."""
    return f"""    <!-- Open Graph -->
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{url}">
    <meta property="og:image" content="{image}">
    <meta property="og:image:width" content="512">
    <meta property="og:image:height" content="512">
    <meta property="og:locale" content="{locale}">
    <meta property="og:site_name" content="Namaz Vakitleri">
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{desc}">
    <meta name="twitter:image" content="{image}">"""


def generate_tr_page(param):
    """Generate Turkish city static HTML."""
    display = city_display_name(param)
    title_city = tr_title_case(param.split('-')[0])
    
    title = f"{title_city} Namaz Vakitleri - Ezan Saatleri"
    desc = f"{title_city} için bugünkü günlük namaz vakitleri, imsak, sabah, öğle, ikindi, akşam, yatsı saatleri ve sıradaki ezana kalan süre. Reklamsız, güvenilir namaz vakitleri."
    
    canonical = f"{BASE_URL_TR}/sehir/{param}/"
    og_image = f"{BASE_URL_TR}/app_icon.webp"
    
    return f"""<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — Namaz Vakitleri</title>
    <meta name="description" content="{desc}">
    <meta name="google-site-verification" content="EktCgN-cMPl00p_o60v8MIxeJU7WuCW_3BtPWkx0m2I" />
{og_tags(title, desc, canonical, og_image, "tr_TR")}
    <link rel="alternate" hreflang="tr" href="{canonical}" />
    <link rel="alternate" hreflang="en" href="{BASE_URL_EN}/city/{param}/" />
    <link rel="alternate" hreflang="x-default" href="{canonical}" />
    <link rel="canonical" href="{canonical}" />
    <link rel="preconnect" href="https://api.aladhan.com">
    <link rel="preconnect" href="https://nominatim.openstreetmap.org">
    <link rel="preconnect" href="https://ipapi.co">
    <link rel="stylesheet" href="../../style.css">
    <link rel="icon" href="../../app_icon.webp" type="image/webp">
    <script async src="https://www.googletagmanager.com/gtag/js?id={GA4_ID}"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','{GA4_ID}');</script>
    <script type="application/ld+json">
{json.dumps(json_ld_city(param, canonical), ensure_ascii=False, indent=4)}
    </script>
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {{"@type": "ListItem", "position": 1, "name": "Namaz Vakitleri", "item": "{BASE_URL_TR}/"}},
        {{"@type": "ListItem", "position": 2, "name": "Şehirler", "item": "{BASE_URL_TR}/sehirler/"}},
        {{"@type": "ListItem", "position": 3, "name": "{display}"}}
      ]
    }}
    </script>
    <script>window.PRERENDERED_CITY="{param}";</script>
    <script>(function(){{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.setAttribute('data-theme',t||(d?'dark':'light'));}})();</script>
</head>
<body data-city="{param}">
    <header class="site-header">
        <div class="container nav-container">
            <a href="../../#live-vakit" class="logo" aria-label="Namaz Vakitleri Ana Sayfa">
                <img src="../../app_icon.webp" alt="Namaz Vakitleri Logosu" class="logo-img" width="40" height="40" loading="eager" fetchpriority="high">
                <span>Namaz Vakitleri</span>
            </a>
            <nav><ul class="nav-links">
                <li><a href="../../#features">Özellikler</a></li>
                <li><a href="../../#showcase">Ekran Görüntüleri</a></li>
                <li><a href="../../#download">İndir</a></li>
            </ul></nav>
            <div class="nav-actions">
                <a href="../../en/city/{param}/" class="lang-switch-btn" aria-label="Switch to English">EN</a>
                <button id="theme-toggle" class="theme-toggle-btn" aria-label="Temayı Değiştir">
                    <svg id="theme-toggle-sun" class="theme-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                    <svg id="theme-toggle-moon" class="theme-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                </button>
            </div>
        </div>
    </header>
    <section id="live-vakit" class="live-vakit-section">
        <div class="container">
            <div class="prayer-widget-card">
                <div class="widget-header">
                    <div class="location-display">
                        <svg class="location-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                        <h2 id="widget-location-name">{display}</h2>
                        <span id="widget-hijri-date" class="hijri-badge">-</span>
                    </div>
                    <div class="search-and-gps">
                        <form id="widget-search-form" class="widget-search-form" onsubmit="event.preventDefault();">
                            <input type="text" id="widget-search-input" placeholder="Şehir veya ilçe ara (Örn: Silivri)..." aria-label="Konum ara" value="{display}">
                            <button type="submit" class="search-submit-btn" aria-label="Ara"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
                        </form>
                    </div>
                </div>
                <div id="prayer-focus-card" class="prayer-focus-card" style="display:none;">
                    <div class="focus-title" id="focus-title-text">-</div>
                    <div class="focus-time" id="focus-time-value">--:--</div>
                    <div class="focus-meta" id="focus-meta-text">-</div>
                </div>
                <div class="widget-content">
                    <div class="countdown-panel">
                        <div class="next-prayer-label">Sıradaki Ezan Vakti</div>
                        <div class="next-prayer-name" id="widget-next-prayer-name">{display} için yükleniyor…</div>
                        <div class="next-prayer-timer" id="widget-countdown-timer">--:--:--</div>
                        <div class="progress-bar-container"><div class="progress-bar-fill" id="widget-progress-fill" style="width:0%;"></div></div>
                        <div class="widget-date-display" id="widget-gregorian-date">{TODAY}</div>
                    </div>
                    <div class="times-grid">
                        <div class="time-card" id="card-imsak"><div class="time-label">İmsak</div><div class="time-value" id="val-imsak">--:--</div></div>
                        <div class="time-card" id="card-gunes"><div class="time-label">Güneş</div><div class="time-value" id="val-gunes">--:--</div></div>
                        <div class="time-card" id="card-ogle"><div class="time-label">Öğle</div><div class="time-value" id="val-ogle">--:--</div></div>
                        <div class="time-card" id="card-ikindi"><div class="time-label">İkindi</div><div class="time-value" id="val-ikindi">--:--</div></div>
                        <div class="time-card" id="card-aksam"><div class="time-label">Akşam</div><div class="time-value" id="val-aksam">--:--</div></div>
                        <div class="time-card" id="card-yatsi"><div class="time-label">Yatsı</div><div class="time-value" id="val-yatsi">--:--</div></div>
                    </div>
                </div>
            </div>
            <div class="seo-quick-links">
                <h3 class="seo-links-title">{title_city} ve Çevresi Namaz Vakitleri</h3>
                <div class="seo-links-grid">
                    <a href="../../sehir/istanbul/" class="seo-link">İstanbul Namaz Vakitleri</a>
                    <a href="../../sehir/ankara/" class="seo-link">Ankara Namaz Vakitleri</a>
                    <a href="../../sehir/izmir/" class="seo-link">İzmir Namaz Vakitleri</a>
                    <a href="../../sehir/bursa/" class="seo-link">Bursa Namaz Vakitleri</a>
                </div>
            </div>
        </div>
    </section>
    <footer class="site-footer">
        <div class="container">
            <div class="footer-logo">
                <img src="../../app_icon.webp" alt="Namaz Vakitleri Logosu" class="logo-img-small" width="32" height="32" loading="lazy">
                <span>Namaz Vakitleri</span>
            </div>
            <p class="footer-bottom">Bu uygulama bireysel kullanım için reklamsız ve ücretsiz olarak tasarlanmıştır. &copy; {TODAY[:4]} Görkem Güray</p>
        </div>
    </footer>
    <script src="../../app.js"></script>
</body>
</html>"""


def generate_en_page(param):
    """Generate English city static HTML."""
    display = city_display_name(param)
    title_city = param.split('-')[0].title()
    
    title = f"{title_city} Prayer Times - Adhan Clock"
    desc = f"Today's daily prayer times, Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha times for {display} and countdown to next prayer. Ad-free, reliable Islamic prayer times."
    
    canonical = f"{BASE_URL_EN}/city/{param}/"
    og_image = f"{BASE_URL_TR}/app_icon.webp"
    tr_canonical = f"{BASE_URL_TR}/sehir/{param}/"
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — Namaz Vakitleri</title>
    <meta name="description" content="{desc}">
{og_tags(title, desc, canonical, og_image, "en_US")}
    <link rel="alternate" hreflang="en" href="{canonical}" />
    <link rel="alternate" hreflang="tr" href="{tr_canonical}" />
    <link rel="alternate" hreflang="x-default" href="{tr_canonical}" />
    <link rel="canonical" href="{canonical}" />
    <link rel="preconnect" href="https://api.aladhan.com">
    <link rel="preconnect" href="https://nominatim.openstreetmap.org">
    <link rel="preconnect" href="https://ipapi.co">
    <link rel="stylesheet" href="../../style.css">
    <link rel="icon" href="../../app_icon.webp" type="image/webp">
    <script async src="https://www.googletagmanager.com/gtag/js?id={GA4_ID}"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','{GA4_ID}');</script>
    <script type="application/ld+json">
{json.dumps(json_ld_city(param, canonical, is_en=True), ensure_ascii=False, indent=4)}
    </script>
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {{"@type": "ListItem", "position": 1, "name": "Namaz Vakitleri", "item": "{BASE_URL_TR}/en/"}},
        {{"@type": "ListItem", "position": 2, "name": "Cities", "item": "{BASE_URL_TR}/en/cities/"}},
        {{"@type": "ListItem", "position": 3, "name": "{display}"}}
      ]
    }}
    </script>
    <script>window.PRERENDERED_CITY="{param}";</script>
    <script>(function(){{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.setAttribute('data-theme',t||(d?'dark':'light'));}})();</script>
</head>
<body data-city="{param}">
    <header class="site-header">
        <div class="container nav-container">
            <a href="../../#live-vakit" class="logo" aria-label="Namaz Vakitleri Home">
                <img src="../../app_icon.webp" alt="Namaz Vakitleri Logo" class="logo-img" width="40" height="40" loading="eager" fetchpriority="high">
                <span>Namaz Vakitleri</span>
            </a>
            <nav><ul class="nav-links">
                <li><a href="../../#features">Features</a></li>
                <li><a href="../../#showcase">Screenshots</a></li>
                <li><a href="../../#download">Download</a></li>
            </ul></nav>
            <div class="nav-actions">
                <a href="../../sehir/{param}/" class="lang-switch-btn" aria-label="Türkçe'ye Geç">TR</a>
                <button id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle Theme">
                    <svg id="theme-toggle-sun" class="theme-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                    <svg id="theme-toggle-moon" class="theme-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                </button>
            </div>
        </div>
    </header>
    <section id="live-vakit" class="live-vakit-section">
        <div class="container">
            <div class="prayer-widget-card">
                <div class="widget-header">
                    <div class="location-display">
                        <svg class="location-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                        <h2 id="widget-location-name">{display}</h2>
                        <span id="widget-hijri-date" class="hijri-badge">-</span>
                    </div>
                    <div class="search-and-gps">
                        <form id="widget-search-form" class="widget-search-form" onsubmit="event.preventDefault();">
                            <input type="text" id="widget-search-input" placeholder="Search city or district..." aria-label="Search location" value="{display}">
                            <button type="submit" class="search-submit-btn" aria-label="Search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
                        </form>
                    </div>
                </div>
                <div id="prayer-focus-card" class="prayer-focus-card" style="display:none;">
                    <div class="focus-title" id="focus-title-text">-</div>
                    <div class="focus-time" id="focus-time-value">--:--</div>
                    <div class="focus-meta" id="focus-meta-text">-</div>
                </div>
                <div class="widget-content">
                    <div class="countdown-panel">
                        <div class="next-prayer-label">Next Prayer</div>
                        <div class="next-prayer-name" id="widget-next-prayer-name">Loading {display}…</div>
                        <div class="next-prayer-timer" id="widget-countdown-timer">--:--:--</div>
                        <div class="progress-bar-container"><div class="progress-bar-fill" id="widget-progress-fill" style="width:0%;"></div></div>
                        <div class="widget-date-display" id="widget-gregorian-date">{TODAY}</div>
                    </div>
                    <div class="times-grid">
                        <div class="time-card" id="card-imsak"><div class="time-label">Fajr</div><div class="time-value" id="val-imsak">--:--</div></div>
                        <div class="time-card" id="card-gunes"><div class="time-label">Sunrise</div><div class="time-value" id="val-gunes">--:--</div></div>
                        <div class="time-card" id="card-ogle"><div class="time-label">Dhuhr</div><div class="time-value" id="val-ogle">--:--</div></div>
                        <div class="time-card" id="card-ikindi"><div class="time-label">Asr</div><div class="time-value" id="val-ikindi">--:--</div></div>
                        <div class="time-card" id="card-aksam"><div class="time-label">Maghrib</div><div class="time-value" id="val-aksam">--:--</div></div>
                        <div class="time-card" id="card-yatsi"><div class="time-label">Isha</div><div class="time-value" id="val-yatsi">--:--</div></div>
                    </div>
                </div>
            </div>
            <div class="seo-quick-links">
                <h3 class="seo-links-title">Popular Prayer Time Queries</h3>
                <div class="seo-links-grid">
                    <a href="../../city/istanbul/" class="seo-link">Istanbul Prayer Times</a>
                    <a href="../../city/ankara/" class="seo-link">Ankara Prayer Times</a>
                    <a href="../../city/izmir/" class="seo-link">Izmir Prayer Times</a>
                    <a href="../../city/bursa/" class="seo-link">Bursa Prayer Times</a>
                </div>
            </div>
        </div>
    </section>
    <footer class="site-footer">
        <div class="container">
            <div class="footer-logo">
                <img src="../../app_icon.webp" alt="Namaz Vakitleri Logo" class="logo-img-small" width="32" height="32" loading="lazy">
                <span>Namaz Vakitleri</span>
            </div>
            <p class="footer-bottom">This app is designed for personal use, ad-free and free of charge. &copy; {TODAY[:4]} Görkem Güray</p>
        </div>
    </footer>
    <script src="../../app.js"></script>
</body>
</html>"""


def main():
    tr_cities = load_cities(os.path.join(WEBSITE_DIR, 'sitemap-tr.xml'))
    en_cities = load_cities(os.path.join(WEBSITE_DIR, 'sitemap-en.xml'))
    
    print(f"Generating {len(tr_cities)} Turkish city pages...")
    for param, priority in tr_cities:
        dir_path = os.path.join(WEBSITE_DIR, 'sehir', param)
        os.makedirs(dir_path, exist_ok=True)
        with open(os.path.join(dir_path, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(generate_tr_page(param))
    
    print(f"Generating {len(en_cities)} English city pages...")
    for param, priority in en_cities:
        dir_path = os.path.join(WEBSITE_DIR, 'en', 'city', param)
        os.makedirs(dir_path, exist_ok=True)
        with open(os.path.join(dir_path, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(generate_en_page(param))
    
    # Generate HTML sitemap pages (all cities index)
    print("Generating HTML sitemap pages...")
    generate_city_index(tr_cities, 'tr')
    generate_city_index(en_cities, 'en')
    
    total = len(tr_cities) + len(en_cities)
    print(f"Done! Generated {total} static city pages + 2 sitemap pages.")


def generate_city_index(cities, lang):
    """Generate an HTML sitemap page listing all cities alphabetically."""
    if lang == 'tr':
        out_dir = os.path.join(WEBSITE_DIR, 'sehirler')
        base = BASE_URL_TR
        prefix = '/sehir/'
        title = 'Tüm Şehirler — Namaz Vakitleri'
        desc = 'Namaz Vakitleri uygulamasının desteklediği tüm şehir ve ilçelerin alfabetik listesi. İstanbul, Ankara, İzmir ve daha fazlası için günlük ezan saatleri.'
        label = 'Tüm Şehir ve İlçeler'
        home_label = 'Ana Sayfa'
    else:
        out_dir = os.path.join(WEBSITE_DIR, 'en', 'cities')
        base = BASE_URL_EN
        prefix = '/city/'
        title = 'All Cities — Namaz Vakitleri'
        desc = 'Complete alphabetical list of all cities and districts supported by Namaz Vakitleri. Daily prayer times for Istanbul, Ankara, Izmir and more.'
        label = 'All Cities & Districts'
        home_label = 'Home'
    
    os.makedirs(out_dir, exist_ok=True)
    
    # Build alphabetical groups
    from collections import defaultdict
    groups = defaultdict(list)
    for param, _ in cities:
        first_char = param[0].upper()
        groups[first_char].append(param)
    
    # Build city links HTML
    links_html = ''
    for char in sorted(groups.keys()):
        cities_sorted = sorted(groups[char], key=lambda x: x.lower())
        links_html += f'        <div class="sitemap-group">\n          <h2>{char}</h2>\n          <ul>\n'
        for param in cities_sorted:
            display = city_display_name(param)
            links_html += f'            <li><a href="{base}{prefix}{param}/">{display}</a></li>\n'
        links_html += '          </ul>\n        </div>\n'
    
    html = f"""<!DOCTYPE html>
<html lang="{'tr' if lang == 'tr' else 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{desc}">
    <link rel="icon" href="{base}/app_icon.webp" type="image/webp">
    <link rel="canonical" href="{base}/{out_dir.split('/')[-1]}/">
    <link rel="stylesheet" href="{base}/style.css">
</head>
<body>
    <header class="site-header">
        <div class="container nav-container">
            <a href="/Namaz-App/" class="logo"><span>Namaz Vakitleri</span></a>
            <nav><ul class="nav-links"><li><a href="/Namaz-App/">{home_label}</a></li></ul></nav>
        </div>
    </header>
    <section class="sitemap-section" style="padding:4rem 1rem;max-width:960px;margin:0 auto;">
        <h1>{label}</h1>
        <p>{desc}</p>
{links_html}
    </section>
    <footer class="site-footer">
        <div class="container">
            <p class="footer-bottom">&copy; {TODAY[:4]} Görkem Güray</p>
        </div>
    </footer>
</body>
</html>"""
    
    with open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"  Created {out_dir}/index.html ({len(cities)} cities)")


if __name__ == '__main__':
    main()
