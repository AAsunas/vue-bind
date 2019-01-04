function MyVue(options){
    //对options进行相关判断，此处省略
    //初始化
    this._init(options);
}

MyVue.prototype._init = function(options){
    this.$el = document.querySelector(options.el);
    this.$data = options.data;
    this.$methods = options.methods;

    //该对象用于驱动视图更新获取相应节点
    this._build = {};

    this._observer(this.$data);
    this._complie(this.$el);
}



_build:{
    number:{
        arr:[]
    }
}



//数据监听器
MyVue.prototype._observer = function(data){
    debugger;
    Object.keys(data).forEach(item => {//item=>key
        //是否是自己原有的属性
        if(data.hasOwnProperty(item)){
            let value = data[item];
            //----------------------------------
            //item为key，即number下再创建一个arr数组，用于存所有关联number变换的对象
            this._build[item] = {
                arr:[]
            };
            if(typeof value === "object"){
                this._observer(value);
            }
            //----------------------------------------
            //获取到_build对象下key值为number的arr数组
            console.log(this._build[item])
            //arr:[
            //    0:Watcher {nodeName: "INPUT", node: input, nodeAttr: "number", nodeValue: "value", vm: MyVue}
            //    1:Watcher {nodeName: "P", node: p, nodeAttr: "number", nodeValue: "innerHTML", vm: MyVue}
            // ]
            var building = this._build[item];
            Object.defineProperty(data,item,{
                enumerable:true,
                configurable:true,
                get:function(){
                    return value;
                },
                set:function(newVal){
                    if(value != newVal){
                        value = newVal;
                        //驱动视图更新方法
                        //------------------------------
                        //循环所有绑定了该变量(number)的值，进行同步更新
                        building.arr.forEach(item => {
                            item._updata();
                        })
                    }
                }
            }) 
        }

    })
}

//指令解析
MyVue.prototype._complie = function(root){
    //获取app选择器下的所有节点
    let nodes = root.children;
    for(let i = 0; i < nodes.length; i++){
        //缓存第一层，判断是否还有子集
        let node = nodes[i];
        if(node.length){
            this._complie(node);
        }

        //绑定v-click事件
        let vClickAttr = node.getAttribute('v-click');//onsbmit
        if(vClickAttr){
            //此处修改this的指向，为了事件的this可以和数据进行关联
            node.addEventListener('click',this.$methods[vClickAttr].bind(this.$data));
        }

        //绑定v-model事件
        let vModelAttr = node.getAttribute('v-model');//number
        if(vModelAttr){
            //-----------------------------------
            //绑定时将它们存在this._build的arr数组中，再对应更新赋值，上面的set才能获取相应节点
            this._build[vModelAttr].arr.push(new Watcher(node.tagName, node, vModelAttr, 'value', this));
            // node.value = this.$data[vModelAttr];

            //当改变input的value值同步更新data中的number值
            let _this = this;
            node.addEventListener('input',function(){
                _this.$data[vModelAttr] = node.value;
            });
        }

        //绑定v-bind事件
        let vBindAttr = node.getAttribute('v-bind');//number
        if(vBindAttr) {
            this._build[vBindAttr].arr.push(new Watcher(node.tagName, node, vBindAttr, 'innerHTML', this));
            // node.innerHTML = this.$data[vBindAttr]
        }
    }
}

//监听，同步更新视图渲染，单独一个方法（连接_observer和_complie）
function Watcher(nodeName, node, nodeAttr, nodeValue, vm) {
    this.nodeName = nodeName;
    this.node = node;
    this.nodeAttr = nodeAttr;
    this.nodeValue = nodeValue;
    this.vm = vm;
    this._updata();
}
Watcher.prototype._updata = function(){
    //通过了nodeValue来给不同类型的dom赋值
    this.node[this.nodeValue] = this.vm.$data[this.nodeAttr];
}



/**
 * 1.初始化：init
 * 2.数据监听器：_observer对data的监听处理defineProperty，get，set
 * 3.指令解析器：_complie循环html的所有标签节点获取有v-click,v-model等自定义属性的值
 *   对其进行相应的事件绑定，涉及到缓存Watcher对象在set中的对应更新
 * 4.Watcher：将更新后的值赋值给对应的dom
 * */
