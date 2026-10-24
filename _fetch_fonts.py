import pathlib
import re
import urllib.request

ua = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)
css_url = (
    "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800"
    "&family=Inter:wght@400;500;600"
    "&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap"
)
req = urllib.request.Request(css_url, headers={"User-Agent": ua})
css = urllib.request.urlopen(req).read().decode()
out = pathlib.Path("assets/fonts")
out.mkdir(parents=True, exist_ok=True)
print("has woff2", "woff2" in css)
local_css = ["/* Self-hosted latin subsets. Display type is an approximation of the PDF grotesque. */"]
for block in css.split("@font-face")[1:]:
    comment = block.split("{", 1)[0]
    if any(tag in comment for tag in ("latin-ext", "cyrillic", "vietnamese", "greek")):
        continue
    if "latin" not in comment and "U+0000-00FF" not in block:
        continue
    url_match = re.search(r"url\((https://fonts.gstatic.com/s/[^)]+)\)", block)
    fam = re.search(r"font-family:\s*'([^']+)'", block)
    weight = re.search(r"font-weight:\s*(\d+)", block)
    style = re.search(r"font-style:\s*(\w+)", block)
    if not all([url_match, fam, weight, style]):
        continue
    url = url_match.group(1)
    ext = "woff2" if url.endswith(".woff2") else url.rsplit(".", 1)[-1]
    name = f"{fam.group(1).lower().replace(' ', '-')}-{style.group(1)}-{weight.group(1)}.{ext}"
    dest = out / name
    if not dest.exists():
        urllib.request.urlretrieve(url, dest)
    fmt = "woff2" if ext == "woff2" else "truetype"
    ur = re.search(r"unicode-range:\s*([^;]+);", block)
    local_css.append("@font-face {")
    local_css.append(f"  font-family: '{fam.group(1)}';")
    local_css.append(f"  font-style: {style.group(1)};")
    local_css.append(f"  font-weight: {weight.group(1)};")
    local_css.append("  font-display: swap;")
    local_css.append(f"  src: url('fonts/{name}') format('{fmt}');")
    if ur:
        local_css.append(f"  unicode-range: {ur.group(1)};")
    local_css.append("}")
    print(name, dest.stat().st_size)
pathlib.Path("assets/fonts.css").write_text("\n".join(local_css) + "\n", encoding="utf-8")
print("wrote fonts.css")
