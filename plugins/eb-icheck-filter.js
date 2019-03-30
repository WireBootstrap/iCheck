(function () {

    $.fn.ebIcheckFilter = function (config) {
    
        var self = this;
        eb.ui.prependClass(self, "eb-icheck-filter eb-plugin");
    
        var defaults = {
            autoInit: true,
            paging: {},
            color: "green",
            ebIcheckList: {
                skin: "line",
                color: null, // set below from root
                lineUnChecked: {color: "default", icon: false},
                style: {
                    ul: "eb-icheck-filter-ul",
                    li: "eb-icheck-filter-li"
                },
                events: { 
                    itemClick: null 
                }
            }
        };
    
        var cmp = new eb.ui.Component(this, config, defaults, true);
        var cfg = cmp.config();
        var plugin;
        
        function _init() {
            _ensureComponent(function () {
                // no data necessary
                _bind();
            });
        }
    
        function _bind() {
    
            var schema = cmp.updateFieldSchema({ id: "Id", name: "Name" });
            var d = cmp.data();
            var t = _template();
            var searchTimeout = 0;
    
            self.empty();
    
            // top row, search box
            var search = cfg.searchTemplate || t.search;
    
            search = $(search);
    
            self.append($(t.row).append($(t.col).append(search)));
    
            search.find("input").keydown(function (e) {
                clearTimeout(searchTimeout);
                var t = $(this);
                searchTimeout = setTimeout(function () {
                    var q = cfg.data.Query.where();
                    if(cfg.data.Query.Paging.Page > 1)
                        cfg.data.Query.page(1);
                    var v = t.val();
                    if (v.length > 0)
                        q.contains(schema.name, v);
                    cfg.data.refresh();
                }, 500);
            });
    
            self.find(".clear-search").click(function (e) {
                search.find("input").val(""); 
                plugin.clear();
            });
    
            search.find("input").prop("placeholder", "Search " + schema.name);
    
            //self.append($(t.row).append($(t.col).append(t.hr)));
    
            // middle row, checkboxes
            cfg.ebIcheckList.schema = cfg.schema;
            // pass ref to event
    
            cfg.ebIcheckList.color = cfg.color;
            cfg.ebIcheckList.data = cfg.data;
            
            plugin = $(t.div).ebIcheckList(cfg.ebIcheckList);
    
            self.append($(t.row).append($(t.col).append(plugin)));
    
            //self.append($(t.row).append(t.hr));
    
            // bottom row, paging
            cfg.paging.data = cfg.data;
            var pager = $(t.div).ebDatasetPaging(cfg.paging);
    
            self.append($(t.row).append($(t.col).append(pager)));
    
            cmp.ready();
    
        }
    
        function _ensureComponent(cb) {
    
            if (typeof $.fn.ebDatasetPaging == 'undefined'){
                eb.loadJs("https://cdn.wirebootstrap.com/libs/bootstrap/2.1.0/eb-bootstrap.min.js", cb);
            }
            else
                cb();
    
        }
    
        function _template() {
    
            return {
                row: "<div class=\"row\"></div>",
                col: "<div class=\"col-md-12\"></div>",
                search: "<div class=\"input-group\"><input placeholder=\"\" class=\"form-control\" /><span class=\"input-group-addon clear-search\">" +
                    "<i class=\"fa fa-times\"></i></span></div>",
                div: "<div></div>",
                hr: "<div class=\"eb-hr\"></div>"
            };
        }
    
        this.getData = function () {
            return cmp.data();
        }
    
        this.config = function () {
            return cfg;
        }
    
        this.databind = function (data) {
            if (data) cmp.data(data);
            _bind();
        }
    
        this.initialize = function () {
            _init();
            return this;
        }
        
        this.pluginCheckbox = function() {
            return plugin;
        }
    
        if (cfg.autoInit)
            _init();
    
        return this;
    }
    
    })();