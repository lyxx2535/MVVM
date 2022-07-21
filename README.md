# MVVM大作业

![image.png](https://s2.loli.net/2022/07/21/cPoSZW6q17jDyOJ.png)

## 1. 项目使用

### 1.1 概述

作业通过实现了简单的mvvm框架，在对fragment编译解析的过程中对{{}}文本元素（v-text指令）、v-model指令、v-html指令、v-on指令、computed函数和methods函数等操作进行了相应的处理，覆盖了所有基本要求。

### 1.2 启动

运行html页面，推荐使用Webstorm。注意VSCode运行时需要开启Live Server避免跨域引发的问题。

### 1.3 使用示例

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>百度前端大作业二</title>
</head>

<body>
<div id="app">
    <div v-html="message"></div>
    作者信息：
    <input class="input" type="text" v-model="author.name">
    <button v-on:click="clickBtn">恢复默认值</button>
    <p>{{author.name}}</p>
    <p>{{author.github}}</p>
    {{getAuthor}}
</div>

<script type="module">
    import { MVVM } from "./js/MVVM.js"
    let vm = new MVVM({//新建mvvm对象，属性有el和data
        el: '#app',
        data: {
            author: {
                name:'lyx',
                github:'https://github.com/lyxx2535'
            },
            message:'<h1>百度前端大作业：mvvm框架</h1>'
        },
        computed: {
            getAuthor:function(){
                return this.author.name + "-" + this.author.github;
            }
        },
        methods: {
            clickBtn: function(e) {
                this.author.name = "lyxClickBtn"
            }
        }
    })
</script>
</body>

</html>
```

运行上述html后显示以下页面，说明v-html、v-text、computed方法正常运行，实现了单向绑定。

![image.png](https://s2.loli.net/2022/07/21/37gf9PToyj4ArtJ.png)

修改文本框内容后，下方同步修改，说明v-model正常运行，实现了双向绑定。![image.png](https://s2.loli.net/2022/07/21/5UXuSHRTGl2o3kP.png)

点击“改变文本框内容”后会调用clickBtn方法，说明v-on绑定methods方法正常。![image.png](https://s2.loli.net/2022/07/21/CZschi4gyuXWRvr.png)

## 2. 项目实现

### 2.1 模块设计

![image.png](https://s2.loli.net/2022/07/21/jANVCG7eKgbIM5w.png)

View：视图，ViewModel：观察者，Model：数据。

当用户操作 View时，ViewModel感知到变化，然后通知Model发生相应改变；反之当Model发生改变，ViewModel也能感知到变化，使View作出相应更新。如此实现双向绑定。

![image.png](https://s2.loli.net/2022/07/21/2Qb5wtHmBTlZVyG.png)

模块设计如下，可以覆盖作业的所有要求：

- Observer实现**数据劫持**：通过`Object.defineProperty()`来劫持各个属性的`setter`，`getter`，在数据变动时发布消息给订阅者，触发相应的监听回调。
- 发布者Dep和订阅者Watcher实现**发布者-订阅者模式**：在数据劫持监听到变化之后通知订阅者。
- Compile编译器实现**单向绑定和双向绑定**：对每个元素节点的指令进行扫描和解析，根据指令模板替换数据，能够订阅并收到每个属性变动的通知，执行指令绑定的相应的回调函数。

### 2.2 代码结构

```js
D:.
│  .babelrc
│  jest.config.js   //配置Jset
│  MVVM.html     //书写html，展示MVVM框架功能
│  package-lock.json
│  package.json
│  README.md   //项目文档
│  
├─.idea
│      .gitignore
│      modules.xml
│      myMVVM.iml
│      workspace.xml
│      
├─coverage  //开启Jest的覆盖率功能
│  │  clover.xml
│  │  coverage-final.json
│  │  lcov.info
│  │  
│  └─lcov-report //因内容多省略
│          
├─js
│      compile.js  //定义了Compile和Updater，实现对每个元素节点指令的解析
│      MVVM.js   //定义了MVVM
│      observer.js   //定义了Observer，实现数据劫持
│      watcher.js   //定义了发布者Dep和订阅者Watcher，实现发布者-订阅者模式
│      
├─node_modules  //因内容过多省略
│          
└─_tests_   //Jest测试代码，利用DOM测试覆盖所有功能
        test.js
```

### 2.3 代码实现

#### 2.2.1 实现Observer/Dep/Watcher

通过`Object.defineProperty()`来劫持各个属性的`setter`，`getter`，在数据变动时发布消息给订阅者，触发相应的监听回调。代码实现如下：

```js
class Observer {
    constructor(data) {
        this.observe(data)
    }

    observe(data) {
        if (!data || typeof data !== 'object') {
            return;
        }

        //获取data的所有key和value，遍历所有属性
        Object.keys(data).forEach(key => {
            this.defineReactive(data, key, data[key]);
            this.observe(data[key])//深度递归劫持
        })
    }

    //定义数据劫持
    defineReactive(data, key, value) {
        const that = this;
        const dep = new Dep;//每个变化的数据都对应一个数组，这个数组存放所有更新的操作

        Object.defineProperty(data, key, {
            enumerable: true,//能否通过for in循环访问属性，默认值为true
            configurable: true,//能否通过delete删除属性从而重新定义属性/修改属性的特性/把属性修改为访问器属性

            get() {//读取属性时调用
                Dep.target && dep.addSub(Dep.target)//如果有就添加到收集订阅者的数组中（发布者维护）
                return value
            },
            set(newVal) {//写入属性时调用
                if (newVal !== value) {
                    that.observe(newVal)//如果是对象，继续劫持
                    value = newVal;
                    dep.notify();//数据更新时发布所有订阅者信息
                }
            }
        })
    }
}
```

数据劫持结合发布者-订阅者模式，在监听到变化之后通知订阅者，所以定义发布者Dep和订阅者Watcher。

Dep内部维护了一个数组，用来收集订阅者，数据变动时触发notify函数，再调用订阅者的update方法。

```js
class Dep {
    constructor() {//Dep维护一个数组，用来收集订阅者
        this.subs = [];
    }

    addSub(watcher) {//添加订阅者
        this.subs.push(watcher)
    }

    notify() {//数据变动时触发数据更新
        this.subs.forEach(watcher => watcher.update());
    }
}
```

Watcher作为连接Observer和Compile的桥梁，给需要变化的Dom增加订阅，当数据变化后执行对应的方法指令绑定的相应回调函数。

```js
// 订阅者：给需要变化的dom增加订阅，当数据变化后执行对应的方法
class Watcher {
    constructor(vm, expr, cb) {
        this.vm = vm;
        this.expr = expr;
        this.callback = cb;
        //获取旧值时会触发Observer中的get方法，从而在Dep中添加自己
        this.value = this.get();
    }

    get() {//获取旧值存在value上
        Dep.target = this;
        const value = this.getVal(this.vm, this.expr);
        Dep.target = null;
        return value;
    }

    getVal(vm, expr) {//获取实例上对应的数据
        const exprArr = expr.split('.');
        const value = exprArr.reduce((prev, curt) => {
            return prev[curt]
        }, vm.$data);
        return value
    }

    update() {//数据更新时调用：如果新值和旧值不相等，调用回调函数
        const oldVal = this.value;
        const newVal = this.getVal(this.vm, this.expr);

        if (newVal !== oldVal) {
            this.value = newVal;
            this.callback(newVal);
        }
    }
}
```

#### 2.2.2 实现Compile

Compile编译器对每个元素节点的指令进行扫描和解析，根据指令模板替换数据，能够订阅并收到每个属性变动的通知，执行指令绑定的相应的回调函数。

```js
class Compile {
    constructor(el, vm) {//传入el和vm实例
        this.el = this.isElement(el) ? el : document.querySelector(el);
        this.vm = vm;

        if (this.el) {//如果获取到元素，开始编译
            //1. 把真实的dom放入内存
            const fragment = this.node2fragment(this.el);

            //2. 编译：提取元素节点v-model和文本节点{{}}
            this.compile(fragment);

            //3. 把编译好的fragment放回页面
            this.el.appendChild(fragment)
        }
    }

    // 判断是否为元素节点，在挂载时使用
    isElement(node) {
        console.log(node)
        return node.nodeType === 1
    }

    //判断是否以v-开头
    isDirective(attrName) {
        return attrName.startsWith('v-');
    }

    //将DOM放到内存中
    node2fragment(el) {
        //创建文档碎片
        const fragment = document.createDocumentFragment();
        while (el.firstChild) {
            fragment.appendChild(el.firstChild)
        }
        return fragment;//返回内存中的结点
    }

    //遍历所有节点，进行对应处理
    compile(fragment) {
        Array.from(fragment.childNodes).forEach(node => {
            if (this.isElement(node)) {//如果是元素节点
                this.compileElement(node);//编译元素
                this.compile(node);//检查是否有嵌套
            } else {//如果是文本节点
                this.compileText(node);//编译文本
            }
        })
    }

    //元素节点 已实现v-model v-text v-html v-on
    compileElement(node) {
        const attrs = node.attributes;//取出当前结点的属性
        Array.from(attrs).forEach(attr => {
            let { name, value: expr } = attr;
            if (this.isDirective(name)) {
                //取expr，在vm.$data中找到值放入节点
                const [, directive] = name.split('-');//取指令类型
                //需要调用不同的指令来处理
                let [directiveName, eventName] = directive.split(":");  //v-on:click
                CompileUtil[directiveName](node, this.vm, expr, eventName)
            }
        })
    }

    //文本节点 匹配节点{{}}中的内容
    compileText(node) {
        const reg = /{{([^}]+)}}/g;//用正则匹配{{}}的内容，内容至少一个非^的字符
        const expr = node.textContent;
        if (reg.test(expr)) {
            const text = expr.replace(reg, '$1').trim();
            CompileUtil.text(node, this.vm, text)
        }
    }
}
```

指令处理集合如下，本项目实现了v-model、v-text、v-html、v-on指令，并支持methods、computed方法的绑定。

```js
const CompileUtil = {
    getVal(vm, expr) {//获取实例上对应的数据
        const exprArr = expr.split('.');
        const value = exprArr.reduce((prev, curt) => {//返回结果会作为下一次的prev
            return prev[curt]
        }, vm.$data)
        return value
    },

    setVal(vm, expr, value) {//
        const exprArr = expr.split('.');
        exprArr.reduce((prev, curt) => {
            if (curt === exprArr[exprArr.length - 1]) {//取到最后一项时赋值
                return prev[curt] = value
            }
            return prev[curt]
        }, vm.$data)
    },

    model(node, vm, expr) {//输入框处理
        const updateFn = this.updater['modelUpdater'];
        // 监控数据变化，变化时会调用callback
        new Watcher(vm, expr, (newVal) => {
            updateFn && updateFn(node, newVal);
        });
        node.addEventListener('input', e => {
            const newVal = e.target.value;
            this.setVal(vm, expr, newVal);
        });
        const value = this.getVal(vm, expr);
        updateFn && updateFn(node, value);
    },

    text(node, vm, expr) {//文本处理 
        const updateFn = this.updater['textUpdater'];
        //取到匹配值 返回内部表达式取值
        new Watcher(vm, expr, (newVal) => {
            updateFn && updateFn(node, newVal);
        });
        const value = this.getVal(vm, expr);
        updateFn && updateFn(node, value);
    },

    html(node, vm, expr) {//html处理
        const updateFn = this.updater['htmlUpdater'];
        new Watcher(vm, expr, (newVal) => {
            updateFn && updateFn(node, newVal);
        })
        const value = this.getVal(vm, expr);
        updateFn && updateFn(node, value);

    },

    on(node, vm, expr, eventName) {//事件绑定
        node.addEventListener(eventName, (e) => {
            vm[expr].call(vm, e);
        })
    },

    updater: {
        textUpdater(node, value) {//文本更新
            node.textContent = typeof value == 'undefined' ? '' : value;
        },
        modelUpdater(node, value) {//输入框更新
            node.value = typeof value == 'undefined' ? '' : value;
        },
        htmlUpdater(node, value) {//html更新
            node.innerHTML = typeof value == 'undefined' ? '' : value;
        }
    }
}
```

#### 2.2.3 实现MVVM

- constructor会接收一个对象，将模板el和数据data绑定到this上，如果存在模板el，则开始进行编译，编译前开启数据劫持。
- proxyData 将$data内数据直接代理到vm实例上。

```js
class MVVM {//MVVM类，ES6写法 
    constructor(options) {//属性有el和data
        this.$el = options.el;
        this.$data = options.data;
        let computed = options.computed;
        let methods = options.methods;

        if (this.$el) {//如果有要编译的模板：开始编译

            //数据劫持：把对象的所有属性改成get和set方法
            new Observer(this.$data);

            //遍历computed配置中的所有属性，为每一个属性创建一个Watcher对象并被Dep收集
            for (let key in computed) {
                Object.defineProperty(this.$data, key, {
                    get: () => {
                        return computed[key].call(this);
                    },
                    set: (newVal) => {
                    }
                })
            }

            // 遍历methods配置中的每个属性，将对应的函数使用bind绑定当前组件实例上
            for (let key in methods) {
                Object.defineProperty(this, key, {
                    get: () => {
                        return methods[key];
                    },
                    set: (newVal) => {
                    }
                })
            }
            //将$data直接代理到vm实例上
            this.proxyData(this.$data);

            //传入数据和元素进行编译，this包含所有数据了
            new Compile(this.$el, this);
        }
    }

    proxyData(data) {//代理后可以用vm代替vm.$data使用，因为绑在this实例上了
        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key, {
                set(newVal) {
                    data[key] = newVal;
                },
                get() {
                    return data[key]
                }
            })
        })
    }
}
```

## 3. 单元测试

### 3.1 测试结果

使用Jest的DOM测试方法进行测试，书写六个覆盖所有功能的测试用例，实现语句、分支、函数、行覆盖率均在80%以上。

测试时在命令行输入`npm test`即可。

![image.png](https://s2.loli.net/2022/07/21/qAJFwYayP5XrcSR.png)

### 3.2 测试代码

测试代码位于\_tests_文件夹下的test.js文件，内容如下：

```js
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
```

## 4. 总结

本项目围绕“实现Observer”、“实现Compile”、“实现Watcher”、“实现MVVM”，实现了MVVM原理，完成对{{}}文本元素（v-text指令）、v-model指令、v-html指令、v-on指令、computed方法和methods方法等操作的正确解析。

特别感谢：[DMQ](https://github.com/DMQ/mvvm)     [yaochenyang007](https://github.com/yaochenyang007/MVVM)