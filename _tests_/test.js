/**
 * @jest-environment jsdom
 */
import { MVVM } from "../js/MVVM";

test('测试v-on绑定methods函数', () => {
    document.body.innerHTML = `
    <div id = "app">
        <button v-on:click="handleClick" id="bt">测试</button>
    </div>
    `;
    const vm = new MVVM({
        el: "#app",
        data: {
            message: "测试进行中",
        },
        methods: {
            handleClick: function () {
                this.message = '测试成功';
            }
        }
    })
    document.getElementById('bt').click();
    let res = '测试成功';
    expect(vm.message).toBe(res);
})

test('测试v-model双向绑定时对数据的读写', () => {
    document.body.innerHTML = `
    <div id = "app">
        <input type="text" v-model="message.a" id="md"/>
    </div>
    `;
    const vm = new MVVM({
        el: "#app",
        data: {
            message: {
                a: "hi"
            },
        },
    })
    expect(document.getElementById('md').value).toBe("hi");
    vm.$data.message.a = "hello";
    expect(document.getElementById('md').value).toBe("hello");
})

test('测试computed函数功能', () => {
    document.body.innerHTML = `
    <div id = "app">
        <p id="cp">{{getAuthor}}</p>
    </div>
    `;
    const vm = new MVVM({
        el: "#app",
        data: {
            author: {
                name:'lyx',
                github:'https://github.com/lyxx2535'
            },
        },
        computed: {
            getAuthor:function(){
                return this.author.name + "-" + this.author.github;
            }
        },
    })
    const res = 'lyx-https://github.com/lyxx2535';
    expect(document.getElementById('cp').textContent).toBe(res);
})

test('测试v-html功能', () => {
    document.body.innerHTML = `
    <div id = "app">
        <div v-html="message" id="ms"></div>
    </div>
    `;
    const vm = new MVVM({
        el: "#app",
        data: {
            message:'<h1>百度前端大作业：mvvm框架</h1>'
        },
    })
    let res = '百度前端大作业：mvvm框架';
    expect(document.getElementById('ms').textContent).toBe(res);
    vm.$data.message = '<h2>修改后的内容</h2>'
    res = '修改后的内容'
    expect(document.getElementById('ms').textContent).toBe(res);
    vm.$data.message = '<h2>修改后的内容</h2>'
    expect(document.getElementById('ms').textContent).toBe(res);
})

test('测试v-text功能', () => {
    document.body.innerHTML = `
    <div id = "app">
        <div v-text="message" id="ms"></div>
    </div>
    `;
    const vm = new MVVM({
        el: "#app",
        data: {
            message:'<h1>百度前端大作业：mvvm框架</h1>'
        },
    })
    let res = '<h1>百度前端大作业：mvvm框架</h1>';
    expect(document.getElementById('ms').textContent).toBe(res);
    vm.$data.message = '<h2>修改后的内容</h2>'
    res = '<h2>修改后的内容</h2>'
    expect(document.getElementById('ms').textContent).toBe(res);
})

test('测试$el为空的防御式编程', () => {
    document.body.innerHTML = `
    <div id = "app"></div>
    `;
    const vm = new MVVM({
    })
    expect(document.getElementById('#app')).toBe(null);
})