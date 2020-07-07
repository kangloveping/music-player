/* 
    网易云API
  1:歌曲搜索接口
    请求地址:https://autumnfish.cn/search?keywords=
    请求方法:get
    请求参数:keywords(查询关键字)
    响应内容:歌曲搜索结果

  2:歌曲url获取接口
    请求地址:https://autumnfish.cn/song/url?id=
    请求方法:get
    请求参数:id(歌曲id)
    响应内容:歌曲url地址
  3.歌曲详情获取
    请求地址:https://autumnfish.cn/song/detail?ids=
    请求方法:get
    请求参数:ids(歌曲id)
    响应内容:歌曲详情(包括封面信息)
  4.热门评论获取
    请求地址:https://autumnfish.cn/comment/hot?type=0&id=
    请求方法:get
    请求参数:id(歌曲id,地址中的type固定为0)
    响应内容:歌曲的热门评论
  5.mv地址获取
    请求地址:https://autumnfish.cn/mv/url?id=
    请求方法:get
    请求参数:id(mvid,为0表示没有mv)
    响应内容:mv的地址
*/
var app = new Vue({
    el: "#player",
    data: {
        query: "",
        musicList: [],
        musicUrl: "",
        musicInfo: "",
        hotComments: [],
        mvUrl: "",
        isShow: false,
        isPlaying: false,
        isActive:false,
        lyric: [],
        lyric_up: "",
        lyric_c: "",
        lyric_un: "",
        isLyric: false,
    },
    methods: {
        // 在Vue中this始终指向Vue，
        // 但一些其他组件如axios中this为undefined
        // 因此需要定义变量that来代替this
        // 用箭头函数则可避免这种情况
        searchMusic: function () {
            // var that = this;
            axios.get("https://autumnfish.cn/search?keywords=" + this.query)
                .then((res) => {
                    // console.log(res);
                    this.musicList = res.data.result.songs;
                    this.isActive = true;
                },
                    (err) => { }
                );
        },
        // musicId参数为从musicList数据中拿到的songs.id
        playMusic: function (musicId) {
            this.lyric = [];    //先清空上一次获取到的歌词数据，避免混乱
            this.isActive = true; //开始显示歌词区域
            
            axios.get("https://autumnfish.cn/song/url?id=" + musicId)
                .then(res => {
                    this.musicUrl = res.data.data[0].url;
                },
                    err => { }
                );
            axios.get("https://autumnfish.cn/song/detail?ids=" + musicId)
                .then(res => {
                    this.musicInfo = res.data.songs[0].al.picUrl;
                },
                    err => { }
                );
            axios.get("https://autumnfish.cn/comment/hot?type=0&id=" + musicId)
                .then(res => {
                    this.hotComments = res.data.hotComments;
                },
                    err => { }
                );
            axios.get("https://autumnfish.cn/lyric?id=" + musicId)
                .then(res => {
                    
                    let lyric_data = res.data.lrc.lyric; //拿到歌词， "[00:00]歌词文本\n[00:21]歌词文本..."
                    let arr = lyric_data.split("\n"); //通过换行符“\n”进行切割分行, [[00:00]歌词文本,[00:21]歌词文本,...]
                    for (let i = 0; i < arr.length; i++) {
                        let arr_text = arr[i].split("]");//将每一组的时间与歌词分离，通过"]"，[[00:00，歌词文本]
                        let lyric_text = arr_text.pop(); //获取歌词文本，用pop方法：删除最后一个元素并输出。"歌词文本"

                        //处理数组剩下时间点元素
                        arr_text.forEach(element => {
                            //substr(a,b)：a为开始截取的位置，b为截取字符数
                            let time_arr = element.substr(1, element.length - 1).split(":");//先把多余的“[”去掉，再分离出分、秒
                            let s = parseInt(time_arr[0]) * 60 + Math.round(time_arr[1]); //把时间转换成秒s

                            let obj = {};//创建一个对象，赋给它2个属性
                            obj.time = s;
                            obj.text = lyric_text;
                            this.lyric.push(obj); //每一行歌词对象存到lyric数组中 [{time:'',text:''},{...}]
                            this.lyric.sort((a, b) => a.time - b.time);//按时间点大小排升序：sort方法
                        });
                    }
                },
                    err => { }
                );

        },
        //监听歌曲时间更新
        updateTime: function () {
            let currentTime = document.querySelector('.audio1').currentTime;//currentTime为h5中audio的时间属性
            this.isLyric = true; //显示歌词区域

            for (let i = 0; i < this.lyric.length; i++) {
                //判断当前时间对应哪句歌词
                if (currentTime > this.lyric[i].time && currentTime < this.lyric[i + 1].time) {
                    // 将歌词文本赋值给对应的p标签
                    this.lyric_up = this.lyric[i - 1].text;
                    this.lyric_c = this.lyric[i].text;
                    this.lyric_un = this.lyric[i + 1].text;
                }
            };
        },
        // 音乐暂停或播放对应的封面动画是否启动
        play: function () {
            this.isPlaying = true;
        },
        pause: function () {
            this.isPlaying = false;
        },
        playMv: function (mvid) {
            document.querySelector('.audio1').pause();  //先暂停音频的播放
            axios.get("https://autumnfish.cn/mv/url?id=" + mvid)
                .then(res => {
                    this.mvUrl = res.data.data.url;
                    this.isShow = true;
                },
                    err => { }
                );
        },
        // 点击MV外部，则关闭MV并继续音乐的播放
        hide: function () {
            this.isShow = false;
            document.querySelector('.audio1').play();
            this.mvUrl = '';
        },

    }
})