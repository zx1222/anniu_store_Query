const network = require('../../utils/promise.js');
const app = getApp()

let QQMapWX = require('../../src/map/qqmap-wx-jssdk.min.js');
let qqmapsdk;

Page({
    data: {
        inputShowed: false,
        inputVal: "",
        hot_city: wx.getStorageSync('hot_city'),
        searchResult: [],
        currentCity: {},
        allCity: wx.getStorageSync('allCity')
    },
    onReady: function () {
        this.mapCtx = wx.createMapContext('myMap')
    },
    onLoad: function () {
        qqmapsdk = new QQMapWX({
            key: '22QBZ-JEL3O-TEQWI-SAL6J-SGKK5-42FLE'
        });
        var _this = this

        _this.getLocation()
        if (_this.data.hot_city == '') {
            _this.getHotCity()
        }
        if (this.data.allCity == '') {
            _this.getAllCity()
        }
    },
    showInput: function () {
        this.setData({
            inputShowed: true
        });
    },
    hideInput: function () {
        this.setData({
            inputVal: "",
            inputShowed: false
        });
    },
    clearInput: function () {
        this.setData({
            inputVal: ""
        });
    },
    inputTyping: function (e) {
        this.setData({
            inputVal: e.detail.value
        });
    },
    formSubmit: function (e) {
        let _this = this
        const url = `${app.globalData.baseUrl}/city/city`
        var data = { keyword: e.detail.value }
        network.request(url, data).then(() => {
            _this.setData({
                searchResult: app.globalData.netWorkData.resultData
            })
        });
    },
    // 获取定位
    getLocation: function () {
        var _this = this
        wx.getLocation({
            type: 'wgs84',
            success: function (res) {
                _this.setData({
                    lat: res.latitude,
                    lng: res.longitude
                })
                qqmapsdk.reverseGeocoder({
                    location: {
                        latitude: res.latitude,
                        longitude: res.longitude
                    },
                    success: function (res) {
                        let city_name = res.result.address_component.city.replace("市", "")
                        let data = { keyword: city_name }
                        let url = `${app.globalData.baseUrl}/city/city`
                        network.request(url, data).then(() => {
                            _this.setData({
                                currentCity: {
                                    city_name: city_name,
                                    id: app.globalData.netWorkData.resultData[0].region_id
                                }
                            })
                        });
                    },
                    fail: function (res) {
                        console.log(res);
                    }
                });
            }
        })
    },
    // 获取全部城市
    getAllCity: function () {
        var _this = this
        const url = `${app.globalData.baseUrl}/city/get-all-city`
        network.request(url, '').then(() => {
            _this.setData({
                allCity: _this.jsonToArray(app.globalData.netWorkData)
            })
            console.log(_this.jsonToArray(app.globalData.netWorkData))
            wx.setStorageSync('allCity', _this.data.allCity)
        });
    },
    getHotCity: function () {
        var _this = this
        let url = `${app.globalData.baseUrl}/city/get-hot-city`
        network.request(url, '').then(() => {
            _this.setData({
                hot_city: _this.jsonToArray(app.globalData.netWorkData.resultData)
            })
            wx.setStorageSync('hot_city', _this.data.hot_city)
        })
    },
    turnToHome: function (e) {
        console.log(e)
        wx.redirectTo({
            url: `../index/index?city=${e.currentTarget.dataset.name}&city_id=${e.currentTarget.dataset.key}`,
        })

    },
    jsonToArray: function (obj) {
        const result = [];
        for (let key in obj) {
            result.push({
                id: key,
                name: obj[key]
            });
        }
        return result;
    },
    // 分享
    onShareAppMessage: function (ops) {
        if (ops.from === 'button') {
            // 来自页面内转发按钮
            console.log(ops.target)
        }
        return {
            title: '北京同仁堂药店查询',
            path: 'pages/index/index',
            imageUrl: '../../src/images/share.jpg',
            success: function (res) {
                // 转发成功
                console.log("转发成功:" + JSON.stringify(res));
            },
            fail: function (res) {
                // 转发失败
                console.log("转发失败:" + JSON.stringify(res));
            }
        }
    }
});