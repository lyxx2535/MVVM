// 订阅者：给需要变化的dom增加订阅，当数据变化后执行对应的方法
export class Watcher {
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

export class Dep {
    constructor() {//Dep维护一个数组，用来收集订阅者
        this.subs = [];
    }

    addSub(watcher) {//添加订阅者
        this.subs.push(watcher);
        return 1;
    }

    notify() {//数据变动时触发数据更新
        this.subs.forEach(watcher => watcher.update());
    }
}