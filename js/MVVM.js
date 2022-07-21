import { Observer } from "./observer.js";
import { Compile } from "./compile.js";

export class MVVM {//MVVM类，ES6写法
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