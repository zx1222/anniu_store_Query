const app = getApp()
const network = require('../../utils/promise.js');
var QQMapWX = require('../../src/map/qqmap-wx-jssdk.min.js');
var qqmapsdk;
Page({

    /**
     * 页面的初始数据
     */
    data: {
        storeInfo: {},
        //map
        location: '',
        name: '',
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onReady: function (e) {
        this.mapCtx = wx.createMapContext('myMap')
    },
    onLoad: function (options) {
        let id = options.id;
        let _this = this
        let url = `${app.globalData.baseUrl}/index/view`
        let data = { id: id }
        network.request(url, data).then(() => {
            _this.setData({
                storeInfo: app.globalData.netWorkData.resultData
            })
        });
    },
    turnToMap: function (e) {
        let _this=this
        qqmapsdk = new QQMapWX({
            key: '22QBZ-JEL3O-TEQWI-SAL6J-SGKK5-42FLE'
        });
        qqmapsdk.geocoder({
            address: `${_this.data.storeInfo.address}`,
            success: function (res) {
                wx.openLocation({
                    name: `${_this.data.storeInfo.branch_name}`,
                    address: `${res.result.address_components.province}${res.result.address_components.district}${res.result.address_components.street}${res.result.address_components.street_number}`,
                    latitude: res.result.location.lat,
                    longitude: res.result.location.lng
                })
            },
            fail: function (res) {
                console.log(res);
            },
            complete: function (res) {
                console.log(res);
            }
        })
    },
    dialing: function (e) {
        console.log(this.data.tel)
        wx.makePhoneCall({
            phoneNumber: this.data.storeInfo.telephone
        })
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
})