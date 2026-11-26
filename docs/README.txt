ĐỀ TÀI 3 - TÌM ĐƯỜNG ĐI BẰNG LEAFLET
======================================

1. CÁCH CHẠY KHUYẾN NGHỊ
-------------------------
Cách 1 (dễ nhất): double-click START_DEMO.bat.
Cách 2: mở thư mục bằng VS Code -> chuột phải index.html -> Open with Live Server.

Địa chỉ khi chạy đúng sẽ có dạng:
    http://127.0.0.1:5500/index.html

Không khuyến nghị double-click index.html để mở bằng file:// vì một số API web có thể bị trình duyệt hạn chế.

2. CÔNG NGHỆ
------------
- Leaflet local 2.0.0-alpha.1: hiển thị bản đồ, marker, popup, polyline và sự kiện click.
- OpenStreetMap: bản đồ nền chính.
- Esri World Street Map: bản đồ nền dự phòng nếu tile OSM không tải được.
- OSRM public demo API: tính bảng khoảng cách đường bộ và tuyến đường thực tế.
- Nominatim Search API: tìm địa điểm theo tên khi người dùng chủ động bấm nút.

3. 6 YÊU CẦU CỦA ĐỀ
-------------------
[ĐẠT] 1. Xây dựng bản đồ các điểm bán hàng có sẵn.
[ĐẠT] 2. Chọn 1 điểm -> tìm cửa hàng gần nhất -> vẽ đường đi.
[ĐẠT] 3. Click 2 điểm A, B -> tìm và vẽ đường đi giữa 2 điểm.
[ĐẠT] 4. Click thêm C, D... -> thêm waypoint và tính lại tuyến.
[ĐẠT] 5. Click bản đồ -> hiển thị Latitude/Longitude.
[ĐẠT] 6. Nhập tọa độ trực tiếp có gợi ý; có thêm tìm tên địa điểm.

4. TÍNH NĂNG BỔ SUNG
--------------------
- Khoảng cách và thời gian của tuyến.
- Danh sách hướng dẫn rẽ/đi thẳng từ OSRM.
- Marker A/B/C... với màu: điểm đầu xanh lá, điểm cuối đỏ, điểm trung gian xanh dương.
- Highlight cửa hàng gần nhất trên danh sách.
- Xóa điểm cuối và reset toàn bộ tuyến.
- Giới hạn tối đa 10 waypoint để demo ổn định.
- Kiểm tra tọa độ trong phạm vi Việt Nam để tránh click nhầm gây lỗi routing.
- Nếu OSRM không phản hồi: dùng khoảng cách Haversine và đường thẳng dự phòng, không làm ứng dụng đứng.
- Nominatim có cooldown để tránh gửi request tìm kiếm quá nhanh.
- Giao diện responsive cho màn hình nhỏ.

5. CẤU TRÚC PROJECT
-------------------
index.html          : cấu trúc giao diện.
css/style.css       : toàn bộ giao diện/hiệu ứng/responsive.
js/app.js           : toàn bộ logic Leaflet, cửa hàng, routing, tìm kiếm.
leaflet/            : thư viện Leaflet tải về (không cần sửa).
START_DEMO.bat      : chạy nhanh server local và mở trình duyệt.
run-local-server.bat: server local thủ công.
CAI_DAT_VAO_DTDM.bat: tiện ích copy project về thư mục DTDM đã cấu hình.

6. LƯU Ý KHI BẢO VỆ
-------------------
- Leaflet KHÔNG tự tính đường đi giao thông. Leaflet hiển thị; OSRM chịu trách nhiệm routing.
- Bộ Leaflet trong project là 2.0.0-alpha.1 nên dùng:
      new L.LeafletMap(...)
      new L.TileLayer(...)
      new L.Marker(...)
  thay vì cú pháp factory Leaflet 1.x như L.map(...).
- Cần Internet để tải tile bản đồ và gọi OSRM/Nominatim.
- Trước khi demo nên bấm "Xóa tuyến / làm lại" để bắt đầu từ trạng thái sạch.

7. THỨ TỰ DEMO KHUYẾN NGHỊ
---------------------------
1) Chỉ các cửa hàng có sẵn.
2) Click bản đồ để hiện tọa độ.
3) Chế độ cửa hàng gần nhất.
4) Chế độ A -> B.
5) Click thêm C, D.
6) Nhập tọa độ và tìm tên địa điểm.



<!-- PROJECT-OVERVIEW-START -->

## Professional Project Overview

### DTDM LEAFLET INTERACTIVE MAP

DTDM LEAFLET is an interactive Web GIS application designed to support geographic information visualization and route planning.

### Project Scope
- Interactive geographic maps
- Store and location visualization
- Nearest-store search
- Multi-waypoint route planning
- Geographic coordinate lookup
- Distance and travel-time calculation
- Map layer management

### Technology Stack
HTML5, CSS3, JavaScript, Leaflet.js, OpenStreetMap, OSRM and Nominatim.

### Project Value
Demonstrates frontend development, geographic data processing, external API integration and Web GIS applications.

<!-- PROJECT-OVERVIEW-END -->
