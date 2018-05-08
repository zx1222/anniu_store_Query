let QQMapWX = require('../../src/map/qqmap-wx-jssdk.min.js');
let qqmapsdk;
//获取应用实例
const app = getApp()
const network = require('../../utils/promise.js');

Page({
    data: {
        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),

        inputShowed: false,
        inputVal: "",

        url: `${app.globalData.baseUrl}/index/index`,

        lng: '',
        lat: '',

        city: {},
        currentRegion: '区域',
        openRegion: false,
        open: false,
        openNearBy: false,
        region_id: '',
        nearby_id: '',
        store_id: '',
        regionList: [],
        nearbyList: [
            {
                id: 0.5,
                name: '500米'
            },
            {
                id: 1,
                name: '1千米'
            },
            {
                id: 2,
                name: '2千米'
            },
            {
                id: 5,
                name: '5千米'
            },
            {
                id: 10,
                name: '10千米'
            }
        ],

        storeList: [],

        // 分页
        loading: false,
        loadmore_end: false,
        currentPage: 1,

        noData: false
    },
    //事件处理函数
    bindViewTap: function () {
        wx.navigateTo({
            url: '../logs/logs'
        })
    },
    onReady: function () {
        this.mapCtx = wx.createMapContext('myMap')
    },
    onLoad: function (options) {
        qqmapsdk = new QQMapWX({
            key: '22QBZ-JEL3O-TEQWI-SAL6J-SGKK5-42FLE'
        });
        let _this = this
        // 获取当前所在城市
        if (JSON.stringify(options) == "{}") {
            _this.getLocation()
        }
        else {
            _this.setData({
                city: { id: options.city_id, location: options.city }
            })
            _this.getRegion(options.city_id)
        }

        if (app.globalData.userInfo) {
            this.setData({
                userInfo: app.globalData.userInfo,
                hasUserInfo: true
            })
        } else if (this.data.canIUse) {
            // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
            // 所以此处加入 callback 以防止这种情况
            app.userInfoReadyCallback = res => {
                this.setData({
                    userInfo: res.userInfo,
                    hasUserInfo: true
                })
            }
        } else {
            // 在没有 open-type=getUserInfo 版本的兼容处理
            wx.getUserInfo({
                success: res => {
                    app.globalData.userInfo = res.userInfo
                    this.setData({
                        userInfo: res.userInfo,
                        hasUserInfo: true
                    })
                }
            })
        }

        //处理附近范围数据
        let nearbyList = this.data.nearbyList
        nearbyList.forEach(function (item, index) {
            item.active = false
        })
        this.setData({
            nearbyList: nearbyList
        })
    },


    getUserInfo: function (e) {
        app.globalData.userInfo = e.detail.userInfo
        this.setData({
            userInfo: e.detail.userInfo,
            hasUserInfo: true
        })
    },

    // 获取定位
    getLocation: function () {
        var _this = this
        _this.setData({
            city: {
                location: '努力定位中...',
                id: '',
                noData: false,
            }
        })
        wx.getLocation({
            type: 'gcj02',
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
                        let location = res.result.address
                        let data = { keyword: city_name }
                        let url = `${app.globalData.baseUrl}/city/city`
                        network.request(url, data).then(() => {
                            _this.setData({
                                city: {
                                    location: city_name,
                                    id: app.globalData.netWorkData.resultData[0].region_id
                                }
                            })
                            _this.getRegionCur(_this.data.city.id)
                        });
                    },
                    fail: function (res) {
                        console.log(res);
                    }
                });
            }
        })
    },
    // 获取城市区域
    getRegionCur: function (city_id) {
        let _this = this
        let data = {
            city_id: city_id,
            lat: _this.data.lat,
            lng: _this.data.lng,
            distance: 20
        }
        network.request(_this.data.url, data).then(() => {
            _this.setData({
                regionList: app.globalData.netWorkData.resultData.districts,
                storeList: app.globalData.netWorkData.resultData.dataProvider
            })
            _this.formatRegion(_this.data.regionList)
        });
    },
    getRegion: function (city_id) {
        let _this = this
        let data = {
            city_id: city_id,
            noData: false,
        }
        network.request(_this.data.url, data).then(() => {
            _this.setData({
                regionList: app.globalData.netWorkData.resultData.districts,
                storeList: app.globalData.netWorkData.resultData.dataProvider
            })
            _this.formatRegion(_this.data.regionList)
        });
    },
    // 处理区域数据
    formatRegion(regionList) {
        regionList.unshift({ region_id: '', region_name: '全部' })
        regionList.forEach(function (item, index) {
            if (index == 0) {
                item.active = true
            }
            else {
                item.active = false
            }
        })
        this.setData({
            regionList: regionList
        })
    },

    // 跳转城市选择页面
    turnToCity: function (e) {
        wx.navigateTo({
            url: '../city/index',
        })
    },
    // 搜索栏
    formSubmit: function (e) {
        let _this = this
        let data = {
            keyword: e.detail.value,
            city_id: _this.data.city.id,
        }
        let regionList = this.data.regionList
        regionList.forEach(function (item, index) {
            item.active = false
        })
        network.request(_this.data.url, data).then(() => {
            if (app.globalData.netWorkData.resultData.dataProvider.length > 0) {
                _this.setData({
                    regionList: regionList,
                    storeList: app.globalData.netWorkData.resultData.dataProvider
                })
            }
            else {
                _this.clearInput()
                _this.setData({
                    noData: true,
                    storeList: []
                })
            }
        });
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
            inputVal: e.detail.value,
            openRegion: false
        });
    },
    // 展开选择区域
    openRegion: function (e) {
        this.setData({
            open: !this.data.open,
            noData: false
        })
    },
    closeRegion: function (e) {
        this.setData({
            openRegion: false,
            open: false
        })
    },
    // 载入门店信息
    selectRegion: function (e) {
        let _this = this
        let region_id = this.data.region_id
        let id = e.currentTarget.dataset.id
        let regionList = this.data.regionList
        let nearbyList = this.data.nearbyList
        let data = {
            city_id: _this.data.city.id,
            district_id: id,
            lat: _this.data.lat,
            lng: _this.data.lng
        }
        nearbyList.forEach(function (item, index) {
            item.active = false
        })
        if (region_id != id) {
            regionList.forEach(function (item, index) {
                if (item.region_id == region_id) {
                    item.active = false
                }
                if (item.region_id == id) {
                    item.active = true
                    _this.setData({
                        currentRegion: item.region_name
                    })
                }
            })
            network.request(_this.data.url, data).then(() => {
                _this.setData({
                    storeList: app.globalData.netWorkData.resultData.dataProvider,
                    nearbyList: nearbyList
                })
            });
        }
        this.setData({
            region_id: id,
            regionList: regionList,
            openNearby: false,
            openRegion: false,
            open: false
        })
    },
    // 展开选择附近
    openNearby: function (e) {
        this.setData({
            openNearby: !this.data.openNearby
        })
    },
    // 选择附近范围
    selectNearby: function (e) {
        let _this = this
        this.setData({
            openNearby: !this.data.openNearby
        })
        let nearby_id = this.data.nearby_id
        let id = e.currentTarget.dataset.id
        let nearbyList = this.data.nearbyList
        let regionList = this.data.regionList
        regionList.forEach(function (item, index) {
            item.active = false
        })
        if (nearby_id != id) {
            nearbyList.forEach(function (item, index) {
                if (item.id == nearby_id) {
                    item.active = false
                }
                if (item.id == id) {
                    item.active = true
                }
            })
        }
        this.setData({
            nearby_id: id,
            nearbyList: nearbyList,
            openNearby: false,
            openRegion: false,
            regionList: regionList,
            district_id: ''
        })
        let data = {
            distance: _this.data.nearby_id,
            lat: _this.data.lat,
            lng: _this.data.lng
        }
        network.request(_this.data.url, data).then(() => {
            _this.setData({
                storeList: app.globalData.netWorkData.resultData.dataProvider,
            })
        });
    },
    // 跳转门店详情
    turnToStore: function (e) {
        wx.navigateTo({
            url: `../store/index?id=${e.currentTarget.dataset.id}`,
        })
    },
    // 分页上拉加载
    onReachBottom: function () {
        let _this = this
        let storeList = this.data.storeList;
        let newStoreList = []
        let data = {
            city_id: _this.data.city.id,
            district_id: _this.data.region_id,
            distance: _this.data.nearby_id,
            page: _this.data.currentPage + 1
        }
        if (!_this.data.loadmore_end) {
            this.setData({
                loading: true
            })
            network.request(_this.data.url, data).then(() => {
                newStoreList = app.globalData.netWorkData.resultData.dataProvider;
                if (newStoreList.length < 10) {
                    _this.setData({
                        loadmore_end: true
                    })
                }

                setTimeout(function () {
                    _this.setData({
                        currentPage: _this.data.currentPage + 1,
                        storeList: storeList.concat(newStoreList),
                        loading: false
                    })
                }, 300)
            });
        }
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
            imageUrl:'../../src/images/share.jpg',
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
})
