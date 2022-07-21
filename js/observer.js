import { Dep } from "./watcher.js"

export class Observer {
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