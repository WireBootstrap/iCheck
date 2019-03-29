
(function () {

    $.fn.ebIcheckList = function (config) {

        var self = this;

        eb.ui.prependClass(self, "eb-icheck-list eb-plugin");

        var cmp = new eb.ui.Component(this, config, _defaults(), true);
        var schema = cmp.updateFieldSchema({ id: "Id", name: "Name", label: "Label", selected: "Selected" });
        var cfg = cmp.config();
        var line = (cfg.skin == "line");

        function _init() {
            _ensureComponent(function () {
                cmp.bindData(_bind);
            });
        }

        function _defaults() {
            return {
                autoInit: true,
                skin: "flat",
                color: "blue",
                lineUnChecked:{ color: null, icon: true},
                style: {
                    ul: "eb-icheck-list-ul",
                    li: "eb-icheck-list-li"
                },
                events: { itemClick: null }
            };
        }

        function _bind() {

            var d = cmp.data();
            var colId = cmp.colId(schema);
            var t = _template();

            self.empty();

            var root = $("<ul class=\"{0}\">".format(cfg.style.ul));

            self.append(root);
        
            d.Rows.forEach(function (row) {

                var selected = eb.toBoolean(row[schema.selected], false);
                var li = $("<li class=\"{0}\">".format(cfg.style.li));

                root.append(li);

                var input = t.input.format(row[colId], selected ? "checked" : "");
                
                var lbl = t.label.format(typeof row[schema.label] == "undefined" ? row[schema.name] : row[schema.label]);

                li.append(input);

                if(!line)
                    li.append(lbl);
                        
                bindCheck(li.find("input"), selected);

            });

            function bindCheck($this, selected){

                var color = (line && cfg.lineUnChecked.color && !selected) ? cfg.lineUnChecked.color: cfg.color;
                var check = {
                    checkboxClass: 'icheckbox_{0}-{1}'.format(cfg.skin, color),
                    radioClass: 'iradio_{0}-{1}'.format(cfg.skin, color)
                    //increaseArea: '10%'
                };

                if(line) 
                    check.insert = t.line.format((!selected && !cfg.lineUnChecked.icon) ? " eb-icheck_line-no-icon" : "") + "<span>label</span>";                

                $this.iCheck(check).on('ifChecked', function(event){                
                    checkChanged(event, true, this);
                }).on('ifUnchecked', function(event){
                    checkChanged(event, false, this);
                });

                // replace line label with one inserted into li
                $this.closest("li").find("span").text($this.val());

            }

            function checkChanged (e, checked, _this) {

                // change disable color
                if(line && cfg.lineUnChecked.color)
                    bindCheck($(_this), checked)

                // send out data event
                var value = $(_this).val();
                var row = d.where().eq(colId, value).first();

                // data event                         
                var ev = _dataEvent(value, row);

                var sel = typeof row[schema.selected] != "undefined";

                if (checked) {
                    if (sel) row[schema.selected] = true;
                    ev.action().add();
                }
                else {
                    if (sel) row[schema.selected] = false;
                    ev.action().remove();
                }

                var ed = { base: e, data: ev.getData() };

                // custom callback
                if (cfg.events.itemClick) {
                    cfg.events.itemClick(ed);
                }

                // fire data event
                ev.raise();

                // local plugin event
                self.trigger('itemClick', ed);

                // write back
                if (d.__meta && d.__meta.dataset) {

                    try {

                        if (this.checked) {
                            if (d.__meta.dataset.Write) {
                                d.__meta.dataset.write(row);
                            }
                        }
                        else
                            if (d.__meta.dataset.Delete != false && d.__meta.dataset.Write) {

                                var del = eb.data.delete().from(d.__meta.dataset.Query.Entities[0].Name).where()
                                    .eq(colId, value);

                                d.__meta.dataset.delete(del);
                            }
                    }

                    catch (ex) {
                        eb.ui.ErrorDialog(ex);
                    }
                }

            }

            cmp.ready();

        }

        function _dataEvent(value, row) {
            
            var d = cmp.data();
            var colId = cmp.colId(schema);

            return new eb.data.DataEvent()
                .dataselect()
                .source(self)
                .cell(colId, value)
                .column(d.getColumn(colId))
                .row(row)
                .table(d);
            
        }
        function _template() {
            return  {
                    input: "<input type=\"checkbox\" value=\"{0}\" {1}>", 
                    label: "<label style=\"padding-left:10px\">{0}</label>",
                    line: "<div class=\"icheck_line-icon{0}\"></div>"
            };
        }

        function _ensureComponent(cb) {

            if (typeof $.fn.iCheck == 'undefined'){
                eb.loadCss({css:'http://localhost:65003/iCheck/css/eb-icheck.css', hidden:"eb-icheck-hidden"});
                eb.loadCss({css:'http://localhost:65003/iCheck/skins/{0}/_all.css?skin={0}'.format(cfg.skin), hidden:"eb-icheck-{0}-hidden".format(cfg.skin)});
                eb.loadJs("https://cdn.wirebootstrap.com/libs/iCheck/js/1.0.2/icheck.min.js?v=1.0.2", cb);
            }
            else
                cb();
        }

        this.clear = function(){
            var d = cfg.data;
            d.Query.where();
            if(d.Query.Paging.Page > 1)
                d.Query.page(1);
            // refresh this dataset
            d.refresh();
            // issue clear to a anything listening
            var ev = _dataEvent(null, null);
            ev.action().clear().raise();        
        }

        this.getData = function () {
            return cmp.data();
        }

        this.config = function () {
            return cfg;
        }

        this.databind = function () {
            _bind();
        }

        this.initialize = function () {
            _init();
            return this;
        }

        if (cfg.autoInit)
            _init();

        return this;
    }

})();

;(function () {

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