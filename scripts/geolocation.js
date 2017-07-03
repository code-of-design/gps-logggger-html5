// GPS LOGGER v1.0
// https://github.com/code-of-design/gps-logggger-html5
(function($){
  "use strict";

  // 現在位置
  var latitude = null; // 緯度.
  var longitude = null; // 経度.
  var latitude_storage = []; // 緯度ストレージ.
  var longitude_storage = []; // 経度ストレージ.
  var CURRENT_POSITION_INTERVAL = 5000; // 現在地取得インターバル.
  // 記録情報
  var current_date = null; // 現在日.
  var recording_mode; // 記録モード.
  // 経過時間
  var lapsed_time = {
    hour: 0,
    minute: 0,
    second: 0
  };
  var LAPSED_TIME_INTERVAL = 1000; // 経過時間インターバル.
  // 移動距離
  var distance = 0; // 移動距離(Meter).
  var distance_storage = []; // 移動距離ストレージ.
  // DOM ID
  var googlemap_id = document.getElementById("google-map__map"); // Google Mapid.
  var latitude_id = document.getElementById("latitude"); // 緯度id.
  var longitude_id = document.getElementById("longitude"); // 経度id.
  var recording_date_id = document.getElementById("recording-info__date"); // 現在日id.
  var recording_mode_id = document.getElementById("recording-info__mode"); // 記録モードid.
  var lapsed_time_id = document.getElementById("lapsed-time__time"); // 経過時間id.
  var movement_distance_id = document.getElementById("movement-distance__distance"); // 移動距離id.
  var recording_btn_id = $(".recording-btn__btn"); // 記録ボタンid.

  // SET UP
  window.onload = function(){
    getCurrentPosition(); // 現在位置を取得する.
    // 位置情報を記録する
    recording_btn_id.click(function(){
      setInterval(getLapsedTime, LAPSED_TIME_INTERVAL); // 経過時間を取得する.
      setInterval(getCurrentPosition, CURRENT_POSITION_INTERVAL); // 現在位置を取得する.
    });
  };

  // 現在位置を取得する
  function getCurrentPosition() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function (position) {
        // 緯度経度を取得する
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        // 緯度経度を正規化する
        latitude = parseFloat(latitude.toFixed(3));
        longitude = parseFloat(longitude.toFixed(3));
        // 現在位置を表示する.
        viewCurrentPosition(latitude_id, longitude_id, latitude, longitude);
        // 位置情報をストレージに追加する.
        addPositionToStorage(latitude, longitude, latitude_storage, longitude_storage);
        console.log(latitude, longitude, getCurrentTime());
      }, errorGetPosition); // 位置情報取得のエラーハンドリング.
    }
  }

  // 現在位置を表示する
  function viewCurrentPosition(lat_id, lng_id, lat, lng) {
    lat_id.innerHTML = "LAT: " + lat;
    lng_id.innerHTML = "LNG: " + lng;
  }

  // 位置情報をストレージに追加する
  function addPositionToStorage(lat, lng, lat_storage, lng_storage){
    var length = lat_storage.length;
    var lat_d = lat_storage[length-1] - lat;
    var lng_d = lng_storage[length-1] - lng;
    var d = 0.005;
    if (length == 0) {
      lat_storage.push(lat);
      lng_storage.push(lng);
      viewGooglemap(lat, lng); // Google Mapsを表示する.
    }
    else if ((lat_d >= d) || (lat_d <= (-1)*d ) || (lng_d >= d) || (lng_d <= (-1)*d)) {
      lat_storage.push(lat);
      lng_storage.push(lng);
      viewGooglemap(lat, lng); // Google Mapsを表示する.
      console.log("PUSH: LAT LNG");
    }
    viewLatLngStorage(latitude_storage, longitude_storage);
    console.log("differ:",lat_d, lng_d,"storage:",lat_storage,lng_storage);
  }

  // 位置情報取得のエラーハンドリング
  function errorGetPosition(error) {
    alert(error.code + ": " + error.message);
  }

  // 位置情報のストレージを表示する.
  function viewLatLngStorage(lat_storage, lng_storage){
    var lat_lng_storage_id = document.getElementById("lat-lng-storage");
    lat_lng_storage_id.innerHTML = lat_storage + "<br>" + lng_storage + "<br>";
  }

  // 位置情報を監視する
  function watchPosition() {
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(function (position) {
        // 緯度経度を取得する
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        // 緯度経度を正規化する
        latitude = parseFloat(latitude.toFixed(3));
        longitude = parseFloat(longitude.toFixed(3));
      }, errorGetPosition);
    }
  }

  // 現在日時を取得する
  function getCurrentTime(){
    var current_date = new Date();
    var y = current_date.getFullYear();
    var m = current_date.getMonth();
    var d = current_date.getDate();
    var h = current_date.getHours();
    var m = current_date.getMinutes();
    var s = current_date.getSeconds();
    return current_date;
  }

  // 経過時間を取得する
  function getLapsedTime(){
    if (lapsed_time.second < 59) {
      lapsed_time.second += 1;
    }
    else {
      lapsed_time.second = 0;
      lapsed_time.minute += 1;
    }

    if (lapsed_time.minute > 59) {
      lapsed_time.minute = 0;
      lapsed_time.hour += 1;
    }
    viewLapsedTime(lapsed_time.hour, lapsed_time.minute, lapsed_time.second);
  }

  // 経過時間を表示する.
  function viewLapsedTime(hour, minute, second){
    var time;
    time = (hour < 10) ? ("0"+hour+":") : (hour+":");
    time += (minute < 10) ? ("0"+minute+":") : (minute+":");
    time += (second < 10) ? ("0"+second) : second
    lapsed_time_id.innerHTML = time;
  }

  // Google Mapsを表示する
  function viewGooglemap(latitude, longitude) {
    var current_position = {
      lat: latitude,
      lng: longitude
    };
    // Mapを宣言する
    var googlemap = new google.maps.Map(googlemap_id, {
      zoom: 17,
      center: current_position
    });
    // マーカを表示する
    var marker = new google.maps.Marker({
      position: current_position,
      map: googlemap
    });
  }

  // 2点距離を測定する [https://developers.google.com/maps/documentation/javascript/geometry?hl=ja]
  function getBetweenDistance(lat_begin, lng_begin, lat_end, lng_end){
    var begin_position = new google.maps.LatLng(lat_begin, lng_begin);
    var end_position = new google.maps.LatLng(lat_end, lng_end);
    var distance = google.maps.geometry.spherical.computeDistanceBetween(begin_position, end_position);

    return distance;
  }
})(jQuery);
