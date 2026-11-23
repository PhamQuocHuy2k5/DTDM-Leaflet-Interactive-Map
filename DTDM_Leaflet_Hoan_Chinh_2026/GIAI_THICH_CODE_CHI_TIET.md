# GIẢI THÍCH CODE CHI TIẾT - ĐỀ TÀI 3 LEAFLET

## 1. Project dùng để làm gì?

Project giải quyết 6 yêu cầu của đề:

1. Hiển thị các điểm bán hàng có sẵn trên bản đồ.
2. Chọn 1 điểm và tìm cửa hàng gần nhất, sau đó vẽ đường đi.
3. Click 2 điểm A và B để tính đường đi giữa hai điểm.
4. Click thêm C, D... để thêm điểm trung gian và tính lại tuyến.
5. Click bản đồ để lấy Latitude/Longitude.
6. Nhập tọa độ trực tiếp có gợi ý; bổ sung tìm địa điểm theo tên.

Ngoài ra project còn hiển thị khoảng cách, thời gian, chỉ đường, hỗ trợ xóa điểm, reset tuyến, xử lý mất API và responsive.

---

## 2. Cấu trúc thư mục

```text
DTDM_Leaflet_Hoan_Chinh_2026/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── leaflet/
│   ├── leaflet.css
│   ├── leaflet-global.js
│   └── ...
├── START_DEMO.bat
├── run-local-server.bat
├── CAI_DAT_VAO_DTDM.bat
├── README.txt
└── GIAI_THICH_CODE_CHI_TIET.md
```

### `index.html`
Tạo cấu trúc giao diện: header, sidebar, nút chức năng, ô nhập, vùng thông tin và vùng bản đồ.

### `css/style.css`
Tạo toàn bộ giao diện: màu sắc, bố cục, card, nút, responsive, marker A/B/C và marker cửa hàng.

### `js/app.js`
Là file quan trọng nhất. Chứa dữ liệu cửa hàng, khởi tạo Leaflet, xử lý click, tìm cửa hàng gần nhất, gọi OSRM, gọi Nominatim, vẽ tuyến và reset.

### `leaflet/`
Đây là thư viện Leaflet 2.0.0-alpha.1 tải từ bên ngoài. Không cần sửa nội dung trong thư mục này.

### `START_DEMO.bat`
Chạy nhanh Python HTTP server ở port 5500 và mở trình duyệt.

---

# 3. GIẢI THÍCH `index.html`

## Dòng 1-7: khai báo tài liệu HTML

- `<!DOCTYPE html>`: cho trình duyệt biết đây là HTML5.
- `<html lang="vi">`: nội dung chính bằng tiếng Việt.
- `<meta charset="UTF-8">`: hiển thị tiếng Việt đúng dấu.
- `viewport`: giúp giao diện responsive trên màn hình nhỏ.
- `description`: mô tả nội dung trang.
- `<title>`: tên xuất hiện trên tab trình duyệt.

## Dòng 10-16: nạp CSS

- `data:,` làm favicon rỗng để tránh lỗi `favicon.ico 404` khi chạy local.
- `leaflet/leaflet.css`: CSS của Leaflet.
- `css/style.css`: CSS do project tự viết.

## Dòng 20-34: header

- `.app-header`: vùng đầu trang.
- `.brand-mark`: chữ L đại diện Leaflet.
- `.eyebrow`: nhãn “ĐỀ TÀI 3”.
- `<h1>`: tên chính của đề tài.
- `.tech-badges`: nhãn các công nghệ Leaflet / OpenStreetMap / OSRM.

## Dòng 38-68: Panel 01 - Chế độ thao tác

- `modeNearest`: nút chế độ 1 điểm → cửa hàng gần nhất.
- `modeRoute`: nút chế độ tạo tuyến A → B → C...
- `aria-pressed`: hỗ trợ accessibility và phản ánh trạng thái nút.
- `modeHelp`: nội dung hướng dẫn thay đổi khi đổi chế độ.

## Dòng 70-98: Panel 02 - Nhập tọa độ / địa điểm

- `placeInput`: ô nhập tọa độ hoặc tên địa điểm.
- `list="localSuggestions"`: liên kết input với danh sách gợi ý.
- `localSuggestions`: datalist chứa gợi ý tọa độ cục bộ.
- `addInputPoint`: thêm tọa độ trực tiếp.
- `searchPlace`: gọi Nominatim để tìm tên địa điểm.
- `searchResults`: vùng hiển thị kết quả tìm kiếm.

## Dòng 100-112: Panel 03 - Thông tin điểm

`coordinateInfo` hiển thị:

```text
Latitude: ...
Longitude: ...
```

JavaScript cập nhật nội dung này mỗi khi người dùng click hoặc nhập điểm.

## Dòng 114-143: Panel 04 - Thông tin tuyến

- `routeDistance`: khoảng cách.
- `routeDuration`: thời gian dự kiến.
- `waypointCount`: số điểm A/B/C...
- `routeMessage`: trạng thái tính tuyến.
- `directions`: danh sách hướng dẫn từng bước.

## Dòng 145-155: Panel 05 - Danh sách cửa hàng

`storeList` ban đầu rỗng. Hàm `renderStores()` trong `app.js` tự sinh danh sách từ mảng `stores`.

## Dòng 157-160: nút quản lý tuyến

- `undoPoint`: xóa điểm cuối.
- `clearRoute`: reset toàn bộ tuyến.

## Dòng 163-179: khu vực bản đồ

- `.map-card-header`: tiêu đề và chú thích marker.
- `#map`: div bắt buộc để Leaflet gắn bản đồ vào.

## Dòng 183-186: nạp JavaScript

Thứ tự rất quan trọng:

```html
<script src="leaflet/leaflet-global.js"></script>
<script src="js/app.js"></script>
```

Leaflet phải được tải trước `app.js`, nếu không biến `L` sẽ chưa tồn tại.

---

# 4. GIẢI THÍCH `css/style.css`

## `:root`
Khai báo biến màu dùng chung như `--primary`, `--danger`, `--border`. Khi muốn đổi màu giao diện chỉ cần sửa ở đây.

## `* { box-sizing: border-box; }`
Giúp chiều rộng phần tử tính luôn padding và border, tránh giao diện bị tràn.

## `html, body`
Đặt font, màu chữ và nền tổng thể.

## `.app-header`
Header dùng Flexbox, sticky ở đầu trang, có blur nhẹ và đường viền.

## `.brand`, `.brand-mark`, `.eyebrow`, `.subtitle`
Tạo phần nhận diện đề tài ở góc trái.

## `.tech-badges`
Hiển thị ba công nghệ chính dưới dạng pill nhỏ.

## `.app-layout`
Dùng CSS Grid:

```css
grid-template-columns: 420px minmax(0, 1fr);
```

Nghĩa là sidebar rộng 420px và phần bản đồ chiếm toàn bộ phần còn lại.

## `.sidebar`
Cho phép cuộn riêng nếu nội dung bảng điều khiển dài hơn màn hình.

## `.panel`
Mỗi chức năng nằm trong một card trắng, bo góc và có shadow nhẹ.

## `.panel-heading`, `.step-number`
Tạo số 01, 02, 03... để giao diện dễ nhìn khi demo.

## `.input-shell`, `input[type="text"]`
Tạo ô nhập hiện đại, đổi viền xanh khi focus.

## `.mode-grid`, `.button-row`
Chia hai nút thành hai cột bằng Grid.

## `.btn`
Style chung cho mọi button. Có hover, disabled và transition.

## `.btn.primary`, `.btn.active`
Dùng màu xanh cho nút chính hoặc chế độ đang được chọn.

## `.btn.danger`
Dùng màu đỏ cho nút reset.

## `.mode-button`
Nút chế độ có icon, tiêu đề và dòng mô tả.

## `.info-box`, `.route-message`
Khối hiển thị thông tin tọa độ hoặc trạng thái tuyến.

## `.route-summary`, `.summary-card`
Tạo 3 ô Khoảng cách / Thời gian / Số điểm.

## `.directions`
Danh sách hướng dẫn có chiều cao tối đa và thanh cuộn.

## `.search-results`, `.search-result`
Giao diện các kết quả Nominatim.

## `.store-card`
Mỗi cửa hàng là một button có số thứ tự, tên, địa chỉ và tọa độ.

## `.store-card.nearest`
Khi một cửa hàng được xác định là gần nhất, card chuyển sang màu xanh lá và hiện nhãn “Gần nhất”.

## `.map-card`, `.map-area`, `#map`
Tạo khung bản đồ lớn ở bên phải. `#map` phải có chiều cao cụ thể để Leaflet hiển thị được.

## `.waypoint-start`, `.waypoint-middle`, `.waypoint-end`
- Điểm đầu: xanh lá.
- Điểm trung gian: xanh dương.
- Điểm cuối: đỏ.

## `.store-marker-icon`
Marker cửa hàng dạng HTML/emoji, không phụ thuộc ảnh marker mặc định.

## Media queries
- Dưới 960px: sidebar và map xếp dọc.
- Dưới 620px: các nút/stat card đổi thành 1 cột.

---

# 5. GIẢI THÍCH `js/app.js` THEO TỪNG KHỐI

## Dòng 1: `"use strict"`
Bật chế độ JavaScript nghiêm ngặt, giúp phát hiện lỗi biến và cú pháp sớm hơn.

## Dòng 16-52: `stores`
Mảng dữ liệu cửa hàng. Mỗi object có:

```js
{
    id,
    name,
    address,
    lat,
    lng
}
```

Muốn thêm cửa hàng mới chỉ cần thêm object mới vào mảng này.

## Dòng 54-68: cấu hình API và phạm vi

- `OSRM_BASE`: server định tuyến.
- `NOMINATIM_BASE`: server tìm địa điểm.
- `VIETNAM_BOUNDS`: giới hạn click trong Việt Nam.
- `MAX_WAYPOINTS`: tối đa 10 điểm.
- `SEARCH_COOLDOWN_MS`: giới hạn tốc độ bấm tìm địa điểm.

## Dòng 72-91: object `ui`
Lấy các phần tử HTML theo `id` một lần rồi lưu lại, tránh gọi `document.getElementById()` nhiều lần.

## Dòng 94-102: biến trạng thái

- `mode`: chế độ hiện tại.
- `waypoints`: mảng các điểm A/B/C...
- `waypointMarkers`: marker A/B/C trên Leaflet.
- `storeMarkers`: marker cửa hàng.
- `storeCards`: card cửa hàng trong sidebar.
- `routeLayer`: đường hiện tại.
- `nearestStoreMarker`: marker cửa hàng gần nhất.
- `routeRequestSerial`: bỏ qua response cũ khi click nhanh.

## Dòng 107-111: tạo bản đồ

```js
const map = new L.LeafletMap("map", {
    center: [10.0340, 105.7880],
    zoom: 13
});
```

Bản đồ được gắn vào `<div id="map">` và lấy Cần Thơ làm tâm ban đầu.

## Dòng 114-172: bản đồ nền và fallback

`tileProviders` chứa:
1. OpenStreetMap.
2. Esri World Street Map dự phòng.

`useTileProvider()`:
- xóa tile layer cũ;
- tạo `new L.TileLayer()`;
- lắng nghe `tileerror`;
- nếu OSM lỗi nhiều tile thì chuyển sang Esri.

## Dòng 183-236: `renderStores()`
Hàm thực hiện yêu cầu 1:

1. Duyệt `stores` bằng `forEach`.
2. Tạo `L.DivIcon` hình cửa hàng.
3. Tạo `L.Marker` tại `lat/lng`.
4. Gắn popup.
5. Tạo card cửa hàng ở sidebar.
6. Khi click card thì map zoom tới cửa hàng và mở popup.

## Dòng 238-257: `buildLocalSuggestions()`
Tạo dữ liệu `<datalist>` để người dùng thấy gợi ý tọa độ cục bộ.

## Dòng 264-282: `setMode()`
Đổi giữa hai chế độ:

- `nearest`: 1 điểm → cửa hàng gần nhất.
- `route`: A → B → C...

Đồng thời đổi màu nút và nội dung hướng dẫn.

## Dòng 284-293: sự kiện nút chế độ
Khi đổi chế độ, chương trình reset tuyến cũ trước để tránh dữ liệu hai chế độ trộn nhau.

## Dòng 298-319: `map.on("click")`
Đây là yêu cầu 5.

Khi click bản đồ:
1. lấy `event.latlng.lat`;
2. lấy `event.latlng.lng`;
3. hiển thị tọa độ;
4. kiểm tra điểm nằm trong Việt Nam;
5. chuyển sang `handleNewPoint()`.

## Dòng 321-327: `showCoordinate()`
Đưa Latitude/Longitude lên `coordinateInfo`.

## Dòng 329-355: `handleNewPoint()`
Hàm phân luồng rất quan trọng:

- Nếu chế độ nearest → `startNearestStoreRoute()`.
- Nếu chế độ route → thêm điểm vào `waypoints`.
- Điểm đầu tiên chỉ tạo A.
- Từ điểm thứ 2 trở đi gọi `requestRoute()`.

## Dòng 363-406: `startNearestStoreRoute()`
Thực hiện yêu cầu 2:

1. Reset tuyến trước.
2. Lưu điểm người dùng.
3. Gọi `findNearestStoreByRoad()`.
4. Nếu OSRM Table lỗi → dùng `findNearestStoreByAir()`.
5. Thêm cửa hàng gần nhất làm điểm đích.
6. Highlight cửa hàng.
7. Gọi `requestRoute()` để vẽ đường.

## Dòng 408-429: `findNearestStoreByAir()`
Fallback tìm gần nhất theo đường chim bay.

## Dòng 431-444: `haversineDistance()`
Công thức Haversine tính khoảng cách giữa hai tọa độ trên bề mặt Trái Đất.

## Dòng 446-482: `findNearestStoreByRoad()`
Dùng OSRM Table API.

Cách hoạt động:
- tọa độ 0 là điểm người dùng;
- tọa độ 1..n là cửa hàng;
- `sources=0` nghĩa là điểm xuất phát;
- `destinations=1;2;...` là các cửa hàng;
- API trả `distances` và `durations`;
- chương trình chọn distance nhỏ nhất.

Đây là cách chính xác hơn so với chỉ so sánh khoảng cách đường chim bay.

## Dòng 484-507: highlight cửa hàng gần nhất

- đưa marker lên trên bằng `setZIndexOffset`;
- mở popup;
- thêm class `.nearest` vào card cửa hàng.

## Dòng 511-579: `requestRoute()`
Là hàm chính cho yêu cầu 3 và 4.

Quy trình:
1. kiểm tra có ít nhất 2 điểm;
2. kiểm tra tất cả điểm nằm trong Việt Nam;
3. tạo chuỗi `lng,lat;lng,lat;...`;
4. gọi OSRM Route API;
5. nhận geometry, distance, duration, legs;
6. vẽ tuyến;
7. cập nhật số liệu;
8. hiển thị hướng dẫn;
9. nếu API lỗi thì vẽ đường thẳng dự phòng.

`routeRequestSerial` tránh trường hợp response cũ ghi đè tuyến mới khi người dùng click quá nhanh.

## Dòng 581-594: `drawRouteGeometry()`
OSRM trả tọa độ theo `[longitude, latitude]`.

Leaflet dùng `[latitude, longitude]`, nên code đảo lại:

```js
coordinates.map(([lng, lat]) => [lat, lng])
```

Sau đó tạo `new L.Polyline()`.

## Dòng 596-614: `drawFallbackStraightLine()`
Nếu OSRM lỗi, vẫn nối các điểm bằng đường đỏ nét đứt để giao diện không bị đứng.

## Dòng 616-620: `updateRouteSummary()`
Cập nhật khoảng cách, thời gian và số điểm.

## Dòng 622-639: `renderDirections()`
Gộp tất cả `legs[].steps[]` của OSRM thành danh sách chỉ đường.

## Dòng 641-681: `instructionForStep()`
Chuyển một số thuật ngữ OSRM tiếng Anh sang câu tiếng Việt như:
- right → rẽ phải;
- left → rẽ trái;
- straight → đi thẳng;
- roundabout → vòng xoay.

## Dòng 689-725: `rebuildWaypointMarkers()`
Xóa marker waypoint cũ và tạo lại A/B/C...

Màu marker:
- A: xanh lá;
- điểm cuối: đỏ;
- các điểm giữa: xanh dương.

## Dòng 727-733: cập nhật UI waypoint

- `updateWaypointCount()`: số điểm.
- `updateActionButtons()`: bật/tắt nút Xóa điểm cuối.

## Dòng 739-763: nút `Thêm điểm`

1. đọc text input;
2. `parseCoordinateInput()`;
3. kiểm tra Việt Nam;
4. zoom map;
5. đưa điểm vào luồng xử lý chung.

## Dòng 765-778: Enter trong input
Nếu nội dung là tọa độ, Enter tương đương “Thêm điểm”. Nếu nội dung là tên địa điểm, Enter tương đương “Tìm địa điểm”.

## Dòng 780-801: `parseCoordinateInput()`
Regex cho phép:

```text
10.0340, 105.7880
10.0340; 105.7880
10.0340 105.7880
```

Sau đó kiểm tra latitude [-90, 90] và longitude [-180, 180].

## Dòng 807-860: `searchPlaceByName()`
Thực hiện tìm tên địa điểm:

1. lấy query;
2. nếu là tọa độ thì không gọi API;
3. cooldown chống bấm quá nhanh;
4. gọi Nominatim chỉ khi người dùng bấm nút;
5. chỉ tìm trong Việt Nam với `countrycodes=vn`;
6. đưa kết quả sang `renderSearchResults()`.

## Dòng 862-865: `setSearchBusy()`
Trong lúc tìm, disable nút và đổi chữ thành “Đang tìm...”.

## Dòng 867-916: `renderSearchResults()`
Tạo từng button kết quả. Khi chọn:
- cập nhật input;
- hiện tọa độ;
- zoom map;
- gọi `handleNewPoint()`.

## Dòng 922-946: Xóa điểm cuối
- pop phần tử cuối của `waypoints`;
- xóa đường cũ;
- tạo lại marker;
- nếu còn >=2 điểm thì routing lại.

## Dòng 948-969: `clearRouteState()`
Reset toàn bộ trạng thái tuyến, marker waypoint, highlight cửa hàng, số liệu và danh sách chỉ đường.

## Dòng 971-983: xóa layer và reset số liệu
- `removeRouteLayer()` xóa polyline hiện tại.
- `resetRouteSummary()` trả khoảng cách/thời gian về `--`.

## Dòng 987-997: `isPointInVietnam()`
Kiểm tra tọa độ có nằm trong bounding box Việt Nam hay không.

## Dòng 999-1012: `sumAirDistances()`
Cộng khoảng cách Haversine của A→B, B→C... khi cần fallback.

## Dòng 1014-1040: format dữ liệu

- `formatDistance()`: m hoặc km.
- `formatDuration()`: phút hoặc giờ + phút.

## Dòng 1042-1048: `indexToLabel()`
0 → A, 1 → B, 2 → C...

## Dòng 1050-1056: `capitalize()`
Viết hoa chữ đầu của câu chỉ đường.

## Dòng 1058-1065: `escapeHtml()`
Chống dữ liệu ngoài chèn HTML không mong muốn vào giao diện.

## Dòng 1067-1071: `showError()`
Ghi lỗi ra Console và hiển thị lỗi trên giao diện.

## Dòng 1073-1099: `fetchJson()`
Hàm chung gọi API:
- dùng `AbortController`;
- timeout request;
- kiểm tra HTTP status;
- parse JSON;
- báo lỗi rõ nếu API quá chậm.

## Cuối file: trạng thái ban đầu

```js
setMode("nearest");
updateWaypointCount();
updateActionButtons();
```

Khi trang vừa tải, chương trình tự chọn chế độ cửa hàng gần nhất và cập nhật UI.

---

# 6. LUỒNG HOẠT ĐỘNG CHÍNH

## Yêu cầu 2

```text
Click điểm
→ map.on("click")
→ handleNewPoint()
→ startNearestStoreRoute()
→ findNearestStoreByRoad()
→ OSRM Table API
→ chọn cửa hàng nhỏ nhất
→ requestRoute()
→ OSRM Route API
→ drawRouteGeometry()
```

## Yêu cầu 3

```text
Click A
→ waypoints = [A]

Click B
→ waypoints = [A, B]
→ requestRoute()
→ vẽ A → B
```

## Yêu cầu 4

```text
A → B đã có
Click C
→ waypoints = [A, B, C]
→ requestRoute()
→ vẽ lại A → B → C
```

## Yêu cầu 6

```text
Nhập tọa độ
→ parseCoordinateInput()
→ handleNewPoint()
```

hoặc:

```text
Nhập tên địa điểm
→ searchPlaceByName()
→ Nominatim
→ renderSearchResults()
→ chọn kết quả
→ handleNewPoint()
```

---

# 7. PHÂN BIỆT LEAFLET VÀ ROUTING API

Điểm quan trọng khi bảo vệ:

**Leaflet không tự tính đường đi giao thông.**

Leaflet phụ trách:
- bản đồ;
- marker;
- popup;
- click;
- polyline;
- zoom/pan.

OSRM phụ trách:
- quãng đường theo đường giao thông;
- thời gian;
- geometry tuyến;
- hướng dẫn rẽ.

OpenStreetMap/Esri phụ trách tile bản đồ nền.

Nominatim phụ trách chuyển tên địa điểm thành tọa độ.

---

# 8. KIỂM TRA ĐỦ 6 YÊU CẦU

| Yêu cầu | Code chính | Trạng thái |
|---|---|---|
| 1. Điểm bán hàng | `stores`, `renderStores()` | Đạt |
| 2. Cửa hàng gần nhất | `startNearestStoreRoute()`, `findNearestStoreByRoad()` | Đạt |
| 3. Hai điểm A-B | `handleNewPoint()`, `requestRoute()` | Đạt |
| 4. Điểm trung gian | `waypoints`, `requestRoute()` | Đạt |
| 5. Click hiện tọa độ | `map.on("click")`, `showCoordinate()` | Đạt |
| 6. Nhập tọa độ có gợi ý | `datalist`, `parseCoordinateInput()`, Nominatim | Đạt |

---

# 9. NHỮNG FILE KHÔNG CẦN GIẢI THÍCH TỪNG DÒNG

Các file trong `leaflet/` là mã nguồn thư viện bên thứ ba, không phải code nghiệp vụ của bài. Khi giảng viên hỏi, chỉ cần nói:

> Em tải thư viện Leaflet về local. Bộ này là Leaflet 2.0.0-alpha.1. Project sử dụng `leaflet.css` và `leaflet-global.js`.

Không cần học thuộc hàng nghìn dòng mã thư viện Leaflet.
