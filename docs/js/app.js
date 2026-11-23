"use strict";

// ============================================================
// ĐỀ TÀI 3 - TÌM ĐƯỜNG ĐI BẰNG LEAFLET
// ------------------------------------------------------------
// Leaflet local : 2.0.0-alpha.1 (global build)
// Bản đồ nền    : OpenStreetMap, dự phòng Esri World Street Map
// Định tuyến    : OSRM public demo API
// Tìm địa điểm  : Nominatim Search API (chỉ gọi khi bấm nút)
// ============================================================

// ============================================================
// 0. DỮ LIỆU VÀ CẤU HÌNH CHUNG
// ============================================================

// ============================================================
// [NOTE GV HỎI] VỊ TRÍ MẪU / CÁC ĐIỂM BÁN HÀNG NẰM Ở ĐÂY.
// Muốn thêm cửa hàng mới: copy 1 object rồi đổi id, name, address, lat, lng.
// Ví dụ:
// { id: 6, name: "Cửa hàng mới", address: "Cần Thơ",
//   lat: 10.0450, lng: 105.7900 }
// lat = Latitude (vĩ độ), lng = Longitude (kinh độ).
// ============================================================
const stores = [
    {
        id: 1,
        name: "Cửa hàng Ninh Kiều",
        address: "Ninh Kiều, Cần Thơ",
        lat: 10.0340,
        lng: 105.7880
    },
    {
        id: 2,
        name: "Cửa hàng Cái Khế",
        address: "Cái Khế, Ninh Kiều, Cần Thơ",
        lat: 10.0540,
        lng: 105.7850
    },
    {
        id: 3,
        name: "Cửa hàng An Bình",
        address: "An Bình, Ninh Kiều, Cần Thơ",
        lat: 10.0195,
        lng: 105.7590
    },
    {
        id: 4,
        name: "Cửa hàng Bình Thủy",
        address: "Bình Thủy, Cần Thơ",
        lat: 10.0630,
        lng: 105.7380
    },
    {
        id: 5,
        name: "Cửa hàng Cái Răng",
        address: "Cái Răng, Cần Thơ",
        lat: 10.0000,
        lng: 105.7800
    }
];

// [GV HỎI] OSRM = dịch vụ tính đường đi, khoảng cách, thời gian.
const OSRM_BASE = "https://router.project-osrm.org";
// [GV HỎI] Nominatim = tìm tên địa điểm -> trả về tọa độ.
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

// [VỊ TRÍ GIỚI HẠN DEMO]
// Giới hạn phạm vi để tránh click nhầm sang quốc gia khác khi demo.
// Nếu GV hỏi kiểm tra điểm có nằm ở Việt Nam không -> xem isPointInVietnam() cuối file.
const VIETNAM_BOUNDS = {
    minLat: 7.5,
    maxLat: 24.5,
    minLng: 101.5,
    maxLng: 110.5
};

// Giới hạn số điểm để request routing không quá dài khi trình diễn.
const MAX_WAYPOINTS = 10;

// Public Nominatim yêu cầu tránh gửi request liên tục.
const SEARCH_COOLDOWN_MS = 1100;

// [GV HỎI] ui = gom/cached các phần tử HTML theo id để JS thao tác nhanh.
// Ví dụ ui.routeDistance tương ứng id="routeDistance" trong index.html.
// Cache các phần tử HTML để dùng lại nhiều lần.
const ui = {
    modeNearest: document.getElementById("modeNearest"),
    modeRoute: document.getElementById("modeRoute"),
    modeHelp: document.getElementById("modeHelp"),
    placeInput: document.getElementById("placeInput"),
    localSuggestions: document.getElementById("localSuggestions"),
    addInputPoint: document.getElementById("addInputPoint"),
    searchPlace: document.getElementById("searchPlace"),
    searchResults: document.getElementById("searchResults"),
    coordinateInfo: document.getElementById("coordinateInfo"),
    routeDistance: document.getElementById("routeDistance"),
    routeDuration: document.getElementById("routeDuration"),
    waypointCount: document.getElementById("waypointCount"),
    routeMessage: document.getElementById("routeMessage"),
    directions: document.getElementById("directions"),
    storeList: document.getElementById("storeList"),
    undoPoint: document.getElementById("undoPoint"),
    clearRoute: document.getElementById("clearRoute")
};

// [GV HỎI] TRẠNG THÁI ỨNG DỤNG
// mode      = chế độ hiện tại (nearest hoặc route).
// waypoints = mảng các điểm A, B, C, D... của tuyến.
// routeLayer= đường Polyline đang vẽ trên bản đồ.
// Trạng thái đang chạy của ứng dụng.
let mode = "nearest";
let waypoints = [];
let waypointMarkers = [];
let storeMarkers = [];
let storeCards = [];
let routeLayer = null;
let nearestStoreMarker = null;
let routeRequestSerial = 0;
// [GV HỎI] Chống lỗi bất đồng bộ: chỉ kết quả tìm gần nhất MỚI NHẤT được hiển thị.
// Ví dụ: click A rồi click B thật nhanh, kết quả A không được ghi đè B.
let nearestRequestSerial = 0;
let searchRequestSerial = 0;
let lastSearchAt = 0;

// ============================================================
// 1. KHỞI TẠO BẢN ĐỒ LEAFLET
// ============================================================

// ============================================================
// [GV HỎI] ĐỔI VỊ TRÍ MỞ BẢN ĐỒ / TÂM BẢN ĐỒ TẠI ĐÂY.
// center: [latitude, longitude]
// Hiện tại lấy khu vực trung tâm Cần Thơ làm vị trí mẫu.
// Muốn đổi vị trí mặc định -> thay 2 số trong center.
// zoom càng lớn thì bản đồ càng phóng gần.
// ============================================================
const map = new L.LeafletMap("map", {
    center: [10.0340, 105.7880],
    zoom: 13
});

// [GV HỎI] BẢN ĐỒ NỀN
// CARTO yêu cầu API key từ năm 2026. Không sử dụng URL CARTO không có key:
// tile vẫn có thể trả HTTP 200 nhưng hiển thị chữ "API KEY REQUIRED".
// Các nguồn công khai khác được cung cấp như tùy chọn, cần Internet và tuân thủ chính sách mỗi nhà cung cấp.
const tileProviders = [
    {
        name: "Esri World Topo Map",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        options: {maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, HERE, Garmin, OpenStreetMap contributors'}
    },
    {
        name: "Esri World Imagery (Vệ tinh)",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        options: {maxZoom: 19, attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'}
    },
    {
        name: "Esri World Street Map",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        options: {maxZoom: 19, attribution: 'Tiles &copy; Esri'}
    },
    {
        name: "OpenStreetMap",
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        options: {maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
    }
];

let baseLayer = null;
let tileErrorCount = 0;
let tileGeneration = 0;
let attemptedTileProviders = new Set();

function showTileNotice(message) {
    let notice = document.getElementById("tileProviderNotice");
    if (!notice) {
        notice = document.createElement("div");
        notice.id = "tileProviderNotice";
        notice.setAttribute("role", "status");
        notice.style.cssText = "position:absolute;left:50%;bottom:48px;transform:translateX(-50%);z-index:1100;background:#09273f;color:white;padding:9px 15px;border-radius:10px;box-shadow:0 4px 18px #0004;font:600 13px system-ui,sans-serif;max-width:85%;text-align:center;pointer-events:none";
        document.getElementById("map")?.appendChild(notice);
    }
    notice.textContent = message;
    notice.hidden = !message;
}

function useTileProvider(index, reason = "", manual = false) {
    if (index < 0 || index >= tileProviders.length) return;
    if (manual) attemptedTileProviders = new Set();
    attemptedTileProviders.add(index);
    const generation = ++tileGeneration;
    if (baseLayer) {
        baseLayer.off();
        map.removeLayer(baseLayer);
    }
    tileErrorCount = 0;
    const provider = tileProviders[index];
    const layer = new L.TileLayer(provider.url, provider.options);
    baseLayer = layer;
    showTileNotice("");

    layer.on("tileerror", () => {
        if (generation !== tileGeneration) return;
        tileErrorCount++;
        if (tileErrorCount < 2) return;
        const next = tileProviders.findIndex((_, i) => !attemptedTileProviders.has(i));
        if (next !== -1) {
            console.warn(`${provider.name} không tải được tile. Đang thử ${tileProviders[next].name}.`);
            useTileProvider(next, "tự động chuyển nguồn do lỗi tải bản đồ");
        } else {
            showTileNotice("Không tải được bản đồ nền. Kiểm tra Internet hoặc đổi nguồn bản đồ.");
            console.error("Tất cả nguồn bản đồ đã thử đều thất bại.");
        }
    });
    layer.on("tileload", () => {
        if (generation === tileGeneration) showTileNotice("");
    });
    layer.addTo(map);
    const select = document.getElementById("baseMapSelect");
    if (select) select.value = String(index);
    if (reason) console.info(`Bản đồ: ${provider.name} (${reason})`);
}

// Chạy với Live Server là cách chuẩn. file:// không đảm bảo mọi API hoạt động.
useTileProvider(0);

// ============================================================
// 2. HIỂN THỊ CÁC ĐIỂM BÁN HÀNG CÓ SẴN
// ============================================================

// [GV HỎI] renderStores(): đọc mảng stores -> tạo marker + popup + card cửa hàng.
// Marker cửa hàng được tạo bằng new L.DivIcon() + new L.Marker().
function renderStores() {
    ui.storeList.innerHTML = "";
    storeMarkers = [];
    storeCards = [];

    stores.forEach((store, index) => {
        // DivIcon giúp marker không phụ thuộc đường dẫn ảnh mặc định của Leaflet.
        const storeIcon = new L.DivIcon({
            className: "",
            html: `<div class="store-marker-icon" title="${escapeHtml(store.name)}">🏪</div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19]
        });

        const marker = new L.Marker([store.lat, store.lng], {
            icon: storeIcon,
            title: store.name,
            alt: store.name
        });

        marker.addTo(map);
        marker.bindPopup(`
            <div>
                <strong>${escapeHtml(store.name)}</strong><br>
                ${escapeHtml(store.address)}<br>
                <small>Lat: ${store.lat.toFixed(6)} | Lng: ${store.lng.toFixed(6)}</small>
            </div>
        `);

        storeMarkers.push({ store, marker });

        const card = document.createElement("button");
        card.type = "button";
        card.className = "store-card";
        card.dataset.storeId = String(store.id);
        card.innerHTML = `
            <span class="store-index">${String(index + 1).padStart(2, "0")}</span>
            <span class="store-content">
                <strong>${escapeHtml(store.name)}</strong>
                <small>${escapeHtml(store.address)}</small>
                <small>${store.lat.toFixed(5)}, ${store.lng.toFixed(5)}</small>
            </span>
            <span class="nearest-badge">Gần nhất</span>
        `;

        // [GV HỎI] Chọn cửa hàng -> đưa tâm bản đồ đến tọa độ cửa hàng.
        card.addEventListener("click", () => {
            showSelectedStore(store);
            map.setView([store.lat, store.lng], 16);
            marker.openPopup();
        });
        marker.on("click", () => showSelectedStore(store));

        storeCards.push({ store, card });
        ui.storeList.appendChild(card);
    });
    // Duy trì bộ lọc nếu danh sách được dựng lại.
    filterStoreCards();
}

// [GV HỎI] BỔ SUNG GIAO DIỆN: Lọc cửa hàng mẫu và hiển thị chi tiết.
// Không gọi API, không thay đổi chức năng routing.
function filterStoreCards() {
    const filterInput = document.getElementById("storeFilter");
    const keyword = (filterInput?.value || "").trim().toLocaleLowerCase("vi");
    let visible = 0;
    storeCards.forEach(({ store, card }) => {
        const match = `${store.name} ${store.address}`.toLocaleLowerCase("vi").includes(keyword);
        card.hidden = !match;
        if (match) visible += 1;
    });
    const count = document.getElementById("storeCount");
    const empty = document.getElementById("storeEmpty");
    if (count) count.textContent = String(visible);
    if (empty) empty.hidden = visible > 0;
}

function showSelectedStore(store) {
    storeCards.forEach(({ card }) => card.classList.toggle("selected", card.dataset.storeId === String(store.id)));
    const detail = document.getElementById("selectedStoreDetail");
    if (detail) detail.innerHTML = `
        <strong>${escapeHtml(store.name)}</strong>
        <div>📍 ${escapeHtml(store.address)}</div>
        <span class="detail-coordinate">${store.lat.toFixed(6)}, ${store.lng.toFixed(6)}</span>
    `;
}

document.getElementById("storeFilter")?.addEventListener("input", filterStoreCards);
document.getElementById("baseMapSelect")?.addEventListener("change", (event) => {
    const providerIndex = Number(event.target.value);
    useTileProvider(providerIndex, "người dùng chọn bản đồ nền", true);
});

// [GV HỎI] buildLocalSuggestions(): tạo gợi ý tọa độ cục bộ cho ô nhập.
// Không gọi API khi chỉ mở danh sách gợi ý này.
function buildLocalSuggestions() {
    ui.localSuggestions.innerHTML = "";

    const examples = [
        { label: "Trung tâm Cần Thơ", value: "10.0340, 105.7880" },
        ...stores.map((store) => ({
            label: store.name,
            value: `${store.lat}, ${store.lng}`
        }))
    ];

    examples.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.value;
        option.label = item.label;
        ui.localSuggestions.appendChild(option);
    });
}

renderStores();
buildLocalSuggestions();

// ============================================================
// 3. CHUYỂN ĐỔI CHẾ ĐỘ THAO TÁC
// ============================================================

// [GV HỎI] setMode(): đổi giữa 2 chế độ:
// - "nearest" = 1 điểm -> cửa hàng gần nhất.
// - "route"   = tạo tuyến A -> B -> C -> ...
function setMode(nextMode) {
    mode = nextMode;

    const nearestActive = mode === "nearest";
    ui.modeNearest.classList.toggle("active", nearestActive);
    ui.modeRoute.classList.toggle("active", !nearestActive);
    ui.modeNearest.setAttribute("aria-pressed", String(nearestActive));
    ui.modeRoute.setAttribute("aria-pressed", String(!nearestActive));

    if (nearestActive) {
        ui.modeHelp.textContent =
            "Click một điểm trên bản đồ. Hệ thống so sánh quãng đường theo mạng lưới đường và chọn cửa hàng gần nhất.";
        ui.routeMessage.textContent = "Chế độ: tìm cửa hàng gần nhất.";
    } else {
        ui.modeHelp.textContent =
            "Click A, sau đó B để tạo tuyến. Click thêm C, D... để thêm điểm trung gian và tính lại đường.";
        ui.routeMessage.textContent = "Chế độ: tạo tuyến nhiều điểm.";
    }
}

ui.modeNearest.addEventListener("click", () => {
    clearRouteState();
    setMode("nearest");
});

ui.modeRoute.addEventListener("click", () => {
    clearRouteState();
    setMode("route");
});

// ============================================================
// 4. CLICK BẢN ĐỒ - LẤY VÀ HIỂN THỊ TỌA ĐỘ
// ============================================================

// [GV HỎI] HÀM/SỰ KIỆN LẤY TỌA ĐỘ KHI CLICK BẢN ĐỒ.
// event.latlng.lat = Latitude; event.latlng.lng = Longitude.
map.on("click", (event) => {
    const point = {
        lat: Number(event.latlng.lat),
        lng: Number(event.latlng.lng),
        label: "Điểm chọn trên bản đồ"
    };

    showCoordinate(point);

    if (!isPointInVietnam(point)) {
        ui.coordinateInfo.innerHTML += `
            <div class="error-text" style="margin-top:8px">
                Điểm nằm ngoài phạm vi Việt Nam của bài demo. Hãy chọn lại trong khu vực Việt Nam.
            </div>
        `;
        ui.routeMessage.innerHTML =
            '<span class="error-text">Không thêm điểm ngoài phạm vi Việt Nam vào tuyến.</span>';
        return;
    }

    handleNewPoint(point);
});

// [GV HỎI] showCoordinate(): đưa lat/lng lên khung "Thông tin điểm".
function showCoordinate(point) {
    ui.coordinateInfo.innerHTML = `
        <strong>${escapeHtml(point.label || "Điểm đã chọn")}</strong><br>
        Latitude: <b>${point.lat.toFixed(6)}</b><br>
        Longitude: <b>${point.lng.toFixed(6)}</b>
    `;
}

// [GV HỎI] handleNewPoint(): "bộ điều phối" điểm mới.
// Nếu mode nearest -> tìm cửa hàng gần nhất.
// Nếu mode route   -> thêm vào waypoints và tính tuyến khi đủ >= 2 điểm.
function handleNewPoint(point) {
    if (!isPointInVietnam(point)) {
        ui.routeMessage.innerHTML =
            '<span class="error-text">Điểm nằm ngoài phạm vi Việt Nam của bài demo.</span>';
        return;
    }

    if (mode === "nearest") {
        startNearestStoreRoute(point);
        return;
    }

    if (waypoints.length >= MAX_WAYPOINTS) {
        ui.routeMessage.innerHTML =
            `<span class="error-text">Để demo ổn định, tối đa ${MAX_WAYPOINTS} điểm cho một tuyến.</span>`;
        return;
    }

    waypoints.push(point);
    rebuildWaypointMarkers();
    updateWaypointCount();
    updateActionButtons();

    if (waypoints.length === 1) {
        ui.routeMessage.textContent = "Đã chọn điểm A. Hãy chọn điểm B.";
    } else {
        requestRoute(waypoints);
    }
}

// ============================================================
// 5. TÌM CỬA HÀNG GẦN NHẤT
// ============================================================

// [GV HỎI] startNearestStoreRoute(): luồng đầy đủ yêu cầu số 2.
// 1) tìm cửa hàng gần nhất, 2) thêm điểm đích, 3) gọi requestRoute().
async function startNearestStoreRoute(origin) {
    clearRouteState(false);
    const currentNearestRequest = ++nearestRequestSerial;

    waypoints = [origin];
    rebuildWaypointMarkers();
    updateWaypointCount();
    updateActionButtons();
    ui.routeMessage.innerHTML = '<span class="loading-text">Đang tìm cửa hàng gần nhất...</span>';

    let nearest;
    let usedFallback = false;

    try {
        // Ưu tiên quãng đường thực tế theo mạng lưới đường bằng OSRM Table API.
        nearest = await findNearestStoreByRoad(origin);
    } catch (error) {
        console.warn("OSRM Table API không khả dụng, chuyển sang khoảng cách địa lý:", error);
        nearest = findNearestStoreByAir(origin);
        usedFallback = true;
    }

    // Nếu người dùng đã đổi chế độ, reset hoặc chọn điểm khác thì bỏ kết quả cũ.
    if (currentNearestRequest !== nearestRequestSerial || mode !== "nearest") {
        return;
    }

    if (!nearest) {
        showError(new Error("Không xác định được cửa hàng gần nhất."));
        return;
    }

    const destination = {
        lat: nearest.store.lat,
        lng: nearest.store.lng,
        label: nearest.store.name
    };

    waypoints = [origin, destination];
    rebuildWaypointMarkers();
    updateWaypointCount();
    updateActionButtons();
    highlightNearestStore(nearest.store);

    ui.routeMessage.innerHTML = usedFallback
        ? `Cửa hàng gần nhất theo khoảng cách địa lý: <span class="store-highlight">${escapeHtml(nearest.store.name)}</span> (${formatDistance(nearest.distance)}). Đang thử lấy tuyến đường thực tế...`
        : `Cửa hàng gần nhất theo đường đi: <span class="store-highlight">${escapeHtml(nearest.store.name)}</span> (${formatDistance(nearest.distance)}).`;

    await requestRoute(waypoints, true);
}

// [DỰ PHÒNG] Nếu OSRM Table lỗi: tìm gần nhất theo đường chim bay (Haversine).
function findNearestStoreByAir(origin) {
    let best = null;

    stores.forEach((store) => {
        const distance = haversineDistance(
            origin.lat,
            origin.lng,
            store.lat,
            store.lng
        );

        if (!best || distance < best.distance) {
            best = {
                store,
                distance,
                duration: null
            };
        }
    });

    return best;
}

// [GV HỎI] haversineDistance(): tính khoảng cách địa lý giữa 2 tọa độ.
// Đây là khoảng cách đường chim bay, KHÔNG phải quãng đường giao thông.
function haversineDistance(lat1, lng1, lat2, lng2) {
    const earthRadius = 6371000;
    const toRad = (degree) => degree * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
}

// [GV HỎI] findNearestStoreByRoad(): dùng OSRM Table API
// để so sánh quãng đường đường bộ từ điểm xuất phát đến tất cả cửa hàng.
async function findNearestStoreByRoad(origin) {
    const coordinates = [origin, ...stores]
        .map((point) => `${point.lng},${point.lat}`)
        .join(";");

    const destinations = stores
        .map((_, index) => index + 1)
        .join(";");

    const url =
        `${OSRM_BASE}/table/v1/driving/${coordinates}` +
        `?sources=0&destinations=${destinations}&annotations=distance,duration`;

    const data = await fetchJson(url, {}, 15000);

    if (data.code !== "Ok" || !data.distances || !data.distances[0]) {
        throw new Error("OSRM không trả về bảng khoảng cách hợp lệ.");
    }

    let best = null;

    data.distances[0].forEach((distance, index) => {
        if (distance == null) {
            return;
        }

        if (!best || distance < best.distance) {
            best = {
                store: stores[index],
                distance,
                duration: data.durations?.[0]?.[index] ?? null
            };
        }
    });

    return best;
}

function highlightNearestStore(store) {
    clearNearestStoreHighlight();

    const foundMarker = storeMarkers.find((item) => item.store.id === store.id);
    if (foundMarker) {
        nearestStoreMarker = foundMarker.marker;
        nearestStoreMarker.setZIndexOffset?.(1000);
        nearestStoreMarker.openPopup();
    }

    const foundCard = storeCards.find((item) => item.store.id === store.id);
    foundCard?.card.classList.add("nearest");
    showSelectedStore(store);
}

function clearNearestStoreHighlight() {
    if (nearestStoreMarker) {
        nearestStoreMarker.setZIndexOffset?.(0);
        nearestStoreMarker = null;
    }

    storeCards.forEach(({ card }) => card.classList.remove("nearest"));
}

// ============================================================
// 6. TÍNH TUYẾN A → B → C → ... VÀ VẼ ĐƯỜNG
// ============================================================

// ============================================================
// [GV HỎI RẤT QUAN TRỌNG] requestRoute(points) = HÀM TÍNH TUYẾN.
// points là mảng A, B, C, D...
// Hàm ghép tọa độ -> gọi OSRM Route API -> nhận GeoJSON -> vẽ Polyline.
// ============================================================
async function requestRoute(points, preserveMessage = false) {
    if (points.length < 2) {
        return;
    }

    if (points.some((point) => !isPointInVietnam(point))) {
        ui.routeMessage.innerHTML =
            '<span class="error-text">Có điểm nằm ngoài phạm vi Việt Nam. Hãy xóa điểm đó và chọn lại.</span>';
        return;
    }

    const currentRequest = ++routeRequestSerial;

    if (!preserveMessage) {
        ui.routeMessage.innerHTML = '<span class="loading-text">Đang tính tuyến đường...</span>';
    }

    ui.directions.innerHTML = "";

    const coordinateString = points
        .map((point) => `${point.lng},${point.lat}`)
        .join(";");

    const url =
        `${OSRM_BASE}/route/v1/driving/${coordinateString}` +
        "?overview=full&geometries=geojson&steps=true&alternatives=false";

    try {
        const data = await fetchJson(url, {}, 18000);

        // Bỏ kết quả cũ nếu người dùng đã click thêm điểm trước khi request hoàn tất.
        if (currentRequest !== routeRequestSerial) {
            return;
        }

        if (data.code !== "Ok" || !data.routes || !data.routes.length) {
            throw new Error("Không tìm được đường đi giữa các điểm đã chọn.");
        }

        const route = data.routes[0];
        drawRouteGeometry(route.geometry.coordinates);
        updateRouteSummary(route);
        renderDirections(route.legs || []);

        if (!preserveMessage) {
            ui.routeMessage.textContent = `Đã tạo tuyến qua ${points.length} điểm.`;
        }
    } catch (error) {
        if (currentRequest !== routeRequestSerial) {
            return;
        }

        console.warn("Không lấy được tuyến OSRM, chuyển sang đường nối dự phòng:", error);
        drawFallbackStraightLine(points);

        const fallbackDistance = sumAirDistances(points);
        ui.routeDistance.textContent = formatDistance(fallbackDistance);
        ui.routeDuration.textContent = "--";
        ui.routeMessage.innerHTML = `
            <span class="error-text">Không kết nối được dịch vụ định tuyến OSRM.</span><br>
            Đã hiển thị đường nối dự phòng giữa các điểm. Khi API hoạt động, tải lại trang để lấy đường đi theo đường giao thông.
        `;

        ui.directions.innerHTML = "";
        const li = document.createElement("li");
        li.textContent = "Chế độ dự phòng: nối thẳng giữa các điểm vì API định tuyến chưa phản hồi.";
        ui.directions.appendChild(li);
    }
}

// ============================================================
// [GV HỎI] ĐỔI MÀU ĐƯỜNG ĐI TẠI HÀM NÀY.
// color   = màu tuyến chính
// weight  = độ dày đường
// opacity = độ trong suốt
// Ví dụ muốn đỏ: color: "#ff0000"
// ============================================================
function drawRouteGeometry(coordinates) {
    removeRouteLayer();

    const latLngs = coordinates.map(([lng, lat]) => [lat, lng]);

    routeLayer = new L.Polyline(latLngs, {
        color: "#0f6cbd",
        weight: 6,
        opacity: 0.9
    });

    routeLayer.addTo(map);
    map.fitBounds(routeLayer.getBounds(), { padding: [38, 38] });
}

// [DỰ PHÒNG] Nếu OSRM lỗi, nối thẳng các điểm bằng đường đỏ nét đứt.
// Muốn đổi màu đường dự phòng -> sửa color trong hàm này.
function drawFallbackStraightLine(points) {
    removeRouteLayer();

    routeLayer = new L.Polyline(
        points.map((point) => [point.lat, point.lng]),
        {
            color: "#c73737",
            weight: 4,
            opacity: 0.78,
            dashArray: "8, 8"
        }
    );

    routeLayer.addTo(map);

    if (points.length > 1) {
        map.fitBounds(routeLayer.getBounds(), { padding: [38, 38] });
    }
}

function updateRouteSummary(route) {
    ui.routeDistance.textContent = formatDistance(route.distance);
    ui.routeDuration.textContent = formatDuration(route.duration);
    updateWaypointCount();
}

// [YÊU CẦU 4 - CÓ CHỈ ĐƯỜNG] OSRM trả về các leg (A→B, B→C, ...)
// và từng step rẽ trái/phải/đi thẳng. Hiển thị rõ từng chặng và chỉ dẫn.
function renderDirections(legs) {
    ui.directions.innerHTML = "";

    if (!legs.some((leg) => Array.isArray(leg.steps) && leg.steps.length)) {
        const li = document.createElement("li");
        li.textContent = "Dịch vụ không trả về hướng dẫn chi tiết cho tuyến này.";
        ui.directions.appendChild(li);
        return;
    }

    legs.forEach((leg, index) => {
        const title = document.createElement("li");
        title.className = "direction-leg";
        title.textContent = `Chặng ${indexToLabel(index)} → ${indexToLabel(index + 1)} · ${formatDistance(leg.distance)} · ${formatDuration(leg.duration)}`;
        ui.directions.appendChild(title);

        (leg.steps || []).forEach((step) => {
            const li = document.createElement("li");
            li.textContent = `${instructionForStep(step)} — ${formatDistance(step.distance)}`;
            ui.directions.appendChild(li);
        });
    });
}

function instructionForStep(step) {
    const maneuver = step.maneuver || {};
    const type = maneuver.type || "continue";
    const modifier = maneuver.modifier || "straight";
    const road = step.name ? ` vào ${step.name}` : "";

    const modifierText = {
        "uturn": "quay đầu",
        "sharp right": "rẽ gắt phải",
        "right": "rẽ phải",
        "slight right": "chếch phải",
        "straight": "đi thẳng",
        "slight left": "chếch trái",
        "left": "rẽ trái",
        "sharp left": "rẽ gắt trái"
    }[modifier] || "đi tiếp";

    const typeText = {
        "depart": "Bắt đầu",
        "arrive": "Đến điểm",
        "turn": capitalize(modifierText),
        "continue": `Tiếp tục ${modifierText}`,
        "new name": `Tiếp tục ${modifierText}`,
        "merge": `Nhập làn và ${modifierText}`,
        "on ramp": `Đi vào đường dẫn và ${modifierText}`,
        "off ramp": `Ra khỏi đường chính và ${modifierText}`,
        "fork": `Tại chỗ rẽ nhánh, ${modifierText}`,
        "end of road": `Cuối đường, ${modifierText}`,
        "roundabout": "Đi vào vòng xoay",
        "rotary": "Đi vào vòng xoay",
        "exit roundabout": "Ra khỏi vòng xoay"
    }[type] || capitalize(modifierText);

    if (type === "arrive") {
        return "Đến điểm tiếp theo";
    }

    if (type === "depart") {
        return `Bắt đầu${road}`;
    }

    return `${typeText}${road}`;
}

// ============================================================
// 7. MARKER A, B, C... CHO CÁC ĐIỂM TUYẾN
// ============================================================

// ============================================================
// [GV HỎI] rebuildWaypointMarkers(): tạo marker A, B, C...
// Màu KHÔNG viết trực tiếp ở đây; hàm gắn class:
// - waypoint-start  -> màu A trong style.css
// - waypoint-middle -> màu B/C/... trong style.css
// - waypoint-end    -> màu điểm cuối trong style.css
// Muốn đổi màu vị trí -> sửa 3 class đó ở css/style.css.
// ============================================================
function rebuildWaypointMarkers() {
    waypointMarkers.forEach((marker) => map.removeLayer(marker));
    waypointMarkers = [];

    waypoints.forEach((point, index) => {
        const label = indexToLabel(index);
        const isStart = index === 0;
        const isEnd = waypoints.length > 1 && index === waypoints.length - 1;
        const markerClass = isStart
            ? "waypoint-start"
            : isEnd
                ? "waypoint-end"
                : "waypoint-middle";

        const icon = new L.DivIcon({
            className: "",
            html: `<div class="waypoint-icon ${markerClass}">${label}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const marker = new L.Marker([point.lat, point.lng], {
            icon,
            title: `${label}: ${point.label || "Điểm tuyến"}`,
            alt: `${label}: ${point.label || "Điểm tuyến"}`
        });

        marker.addTo(map);
        marker.bindPopup(`
            <strong>Điểm ${label}</strong><br>
            ${escapeHtml(point.label || "Điểm tuyến")}<br>
            ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}
        `);

        waypointMarkers.push(marker);
    });
}

function updateWaypointCount() {
    ui.waypointCount.textContent = String(waypoints.length);
}

function updateActionButtons() {
    ui.undoPoint.disabled = waypoints.length === 0;
}

// ============================================================
// 8. NHẬP TỌA ĐỘ TRỰC TIẾP + GỢI Ý CỤC BỘ
// ============================================================

// [GV HỎI] NÚT "Thêm điểm": đọc dữ liệu ô placeInput -> parseCoordinateInput().
ui.addInputPoint.addEventListener("click", () => {
    const value = ui.placeInput.value.trim();
    const parsed = parseCoordinateInput(value);

    if (!parsed) {
        ui.coordinateInfo.innerHTML =
            '<span class="error-text">Không nhận ra tọa độ. Hãy nhập dạng: 10.0340, 105.7880</span>';
        return;
    }

    const point = {
        ...parsed,
        label: "Điểm nhập trực tiếp"
    };

    if (!isPointInVietnam(point)) {
        ui.coordinateInfo.innerHTML =
            '<span class="error-text">Tọa độ hợp lệ nhưng nằm ngoài phạm vi Việt Nam của bài demo.</span>';
        return;
    }

    showCoordinate(point);
    map.setView([point.lat, point.lng], 16);
    handleNewPoint(point);
});

ui.placeInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
        return;
    }

    event.preventDefault();

    // Enter với tọa độ -> thêm điểm; Enter với tên -> tìm địa điểm.
    if (parseCoordinateInput(ui.placeInput.value.trim())) {
        ui.addInputPoint.click();
    } else {
        ui.searchPlace.click();
    }
});

// [GV HỎI] parseCoordinateInput(): kiểm tra chuỗi nhập có đúng dạng lat,lng không.
// Ví dụ hợp lệ: 10.0340, 105.7880
function parseCoordinateInput(value) {
    const match = value.match(
        /^\s*(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)\s*$/
    );

    if (!match) {
        return null;
    }

    const lat = Number(match[1]);
    const lng = Number(match[2]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return null;
    }

    return { lat, lng };
}

// ============================================================
// 9. TÌM TÊN ĐỊA ĐIỂM BẰNG NOMINATIM
// ============================================================

ui.searchPlace.addEventListener("click", searchPlaceByName);

// [GV HỎI] searchPlaceByName(): tìm địa điểm theo tên bằng Nominatim.
// Ví dụ nhập "Đại học Cần Thơ" -> API trả về lat/lon -> đưa lên bản đồ.
async function searchPlaceByName() {
    const query = ui.placeInput.value.trim();

    if (!query) {
        ui.searchResults.innerHTML =
            '<span class="error-text">Hãy nhập tên địa điểm cần tìm.</span>';
        return;
    }

    // Nếu người dùng nhập tọa độ thì không cần gọi geocoding API.
    const coordinate = parseCoordinateInput(query);
    if (coordinate) {
        ui.searchResults.innerHTML = "";
        ui.addInputPoint.click();
        return;
    }

    const now = Date.now();
    const elapsed = now - lastSearchAt;
    if (elapsed < SEARCH_COOLDOWN_MS) {
        ui.searchResults.innerHTML =
            '<span class="loading-text">Vui lòng chờ một chút rồi tìm lại.</span>';
        return;
    }
    lastSearchAt = now;

    const currentSearchRequest = ++searchRequestSerial;
    setSearchBusy(true);
    ui.searchResults.innerHTML = '<span class="loading-text">Đang tìm địa điểm...</span>';

    try {
        const url =
            `${NOMINATIM_BASE}/search` +
            `?format=jsonv2&limit=5&countrycodes=vn&q=${encodeURIComponent(query)}`;

        const results = await fetchJson(
            url,
            {
                headers: {
                    "Accept-Language": "vi,en;q=0.8"
                }
            },
            15000
        );

        if (currentSearchRequest === searchRequestSerial) renderSearchResults(results);
    } catch (error) {
        if (currentSearchRequest === searchRequestSerial) {
            ui.searchResults.innerHTML =
                `<span class="error-text">${escapeHtml(error.message)}</span>`;
        }
    } finally {
        if (currentSearchRequest === searchRequestSerial) setSearchBusy(false);
    }
}

function setSearchBusy(isBusy) {
    ui.searchPlace.disabled = isBusy;
    ui.searchPlace.textContent = isBusy ? "Đang tìm..." : "Tìm địa điểm";
}

function renderSearchResults(results) {
    ui.searchResults.innerHTML = "";

    if (!Array.isArray(results) || !results.length) {
        ui.searchResults.innerHTML = "Không tìm thấy địa điểm phù hợp.";
        return;
    }

    results.forEach((result) => {
        const lat = Number(result.lat);
        const lng = Number(result.lon);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return;
        }

        const point = { lat, lng };
        if (!isPointInVietnam(point)) {
            return;
        }

        const button = document.createElement("button");
        button.type = "button";
        button.className = "search-result";
        button.innerHTML = `
            <strong>${escapeHtml(result.display_name)}</strong>
            <small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
        `;

        button.addEventListener("click", () => {
            const selectedPoint = {
                lat,
                lng,
                label: result.display_name
            };

            ui.placeInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            ui.searchResults.innerHTML = "";
            showCoordinate(selectedPoint);
            map.setView([lat, lng], 16);
            handleNewPoint(selectedPoint);
        });

        ui.searchResults.appendChild(button);
    });

    if (!ui.searchResults.children.length) {
        ui.searchResults.innerHTML = "Không tìm thấy địa điểm phù hợp trong Việt Nam.";
    }
}

// ============================================================
// 10. XÓA ĐIỂM CUỐI / RESET TOÀN BỘ TUYẾN
// ============================================================

// [GV HỎI] XÓA ĐIỂM CUỐI: pop() khỏi mảng waypoints rồi tính/vẽ lại tuyến.
ui.undoPoint.addEventListener("click", () => {
    if (!waypoints.length) {
        return;
    }

    waypoints.pop();
    routeRequestSerial += 1;
    nearestRequestSerial += 1;
    removeRouteLayer();
    clearNearestStoreHighlight();
    rebuildWaypointMarkers();
    updateWaypointCount();
    updateActionButtons();
    resetRouteSummary();
    ui.directions.innerHTML = "";

    if (mode === "route" && waypoints.length >= 2) {
        requestRoute(waypoints);
    } else if (mode === "route" && waypoints.length === 1) {
        ui.routeMessage.textContent = "Còn điểm A. Hãy chọn điểm B.";
    } else if (waypoints.length === 0) {
        ui.routeMessage.textContent = "Đã xóa hết các điểm tuyến.";
    } else {
        ui.routeMessage.textContent = "Đã xóa điểm cuối.";
    }
});

ui.clearRoute.addEventListener("click", () => clearRouteState());
// Nút "Làm lại" trong cột phải dùng cùng hàm reset như nút dưới bản đồ.
document.getElementById("resetRouteSide")?.addEventListener("click", () => clearRouteState());

// [GV HỎI] clearRouteState(): reset toàn bộ điểm/tuyến về trạng thái ban đầu.
function clearRouteState(resetMessage = true) {
    routeRequestSerial += 1;
    nearestRequestSerial += 1;
    // Hủy kết quả tìm tên đang chờ, tránh dữ liệu cũ xuất hiện sau khi reset.
    searchRequestSerial += 1;
    setSearchBusy(false);
    waypoints = [];

    waypointMarkers.forEach((marker) => map.removeLayer(marker));
    waypointMarkers = [];

    removeRouteLayer();
    clearNearestStoreHighlight();
    updateWaypointCount();
    updateActionButtons();
    resetRouteSummary();

    ui.directions.innerHTML = "";
    ui.searchResults.innerHTML = "";

    if (resetMessage) {
        ui.routeMessage.textContent = "Chưa có tuyến đường.";
    }
}

function removeRouteLayer() {
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }
}

function resetRouteSummary() {
    ui.routeDistance.textContent = "--";
    ui.routeDuration.textContent = "--";
}

// ============================================================
// 11. CÁC HÀM HỖ TRỢ
// ============================================================

// [GV HỎI] isPointInVietnam(): kiểm tra lat/lng có nằm trong khung Việt Nam demo.
function isPointInVietnam(point) {
    return Boolean(
        point &&
        Number.isFinite(Number(point.lat)) &&
        Number.isFinite(Number(point.lng)) &&
        Number(point.lat) >= VIETNAM_BOUNDS.minLat &&
        Number(point.lat) <= VIETNAM_BOUNDS.maxLat &&
        Number(point.lng) >= VIETNAM_BOUNDS.minLng &&
        Number(point.lng) <= VIETNAM_BOUNDS.maxLng
    );
}

function sumAirDistances(points) {
    let total = 0;

    for (let index = 1; index < points.length; index += 1) {
        total += haversineDistance(
            points[index - 1].lat,
            points[index - 1].lng,
            points[index].lat,
            points[index].lng
        );
    }

    return total;
}

function formatDistance(meters) {
    if (!Number.isFinite(meters)) {
        return "--";
    }

    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }

    return `${(meters / 1000).toFixed(2)} km`;
}

function formatDuration(seconds) {
    if (!Number.isFinite(seconds)) {
        return "--";
    }

    const minutes = Math.round(seconds / 60);

    if (minutes < 60) {
        return `${minutes} phút`;
    }

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}

function indexToLabel(index) {
    if (index < 26) {
        return String.fromCharCode(65 + index);
    }

    return String(index + 1);
}

function capitalize(text) {
    if (!text) {
        return "";
    }

    return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showError(error) {
    console.error(error);
    ui.routeMessage.innerHTML =
        `<span class="error-text">${escapeHtml(error.message || String(error))}</span>`;
}

// [GV HỎI] fetchJson(): hàm dùng fetch() gọi API + timeout + kiểm tra HTTP lỗi.
// OSRM và Nominatim đều đi qua hàm hỗ trợ này.
async function fetchJson(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`API lỗi HTTP ${response.status}.`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("API phản hồi quá lâu. Hãy kiểm tra Internet và thử lại.");
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

// ============================================================
// 12. TRẠNG THÁI BAN ĐẦU
// ============================================================

setMode("nearest");
updateWaypointCount();
updateActionButtons();
