import { Watcher } from "./watcher.js";

export class Compile {
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
        return node.nodeType === 1;
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

//编译对象
const CompileUtil = {
    getVal(vm, expr) {//获取实例上对应的数据
        const exprArr = expr.split('.');
        const value = exprArr.reduce((prev, curt) => {//返回结果会作为下一次的prev
            return prev[curt]
        }, vm.$data)
        return value
    },

    setVal(vm, expr, value) {
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

