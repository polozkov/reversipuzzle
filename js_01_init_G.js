//Global Game object
var G = {
    //setting of view
    S: {
        NX: 2,
        NY: 10,

        arr_start_position: [0,-1,-1,1,1,-1,1,1,1,-1,-1,1,1,1,-1,-1,-1,-1,1,-1],

        rgb_ball_border: "#000",
        rgb_cell_border: "#333",

        //-1, 0, +1: blue, white, red
        arr_rgb_sign: ["#3914AF","none","#FF0000"],
        arr_rgb_unselected_selected: ["#FFF", "#00CC00"],

        f_style_ball: function(owner_sign, stroke_width = 1) {
            var stroke = owner_sign ? G.S.rgb_ball_border : "none";
            return new G.F_STYLE(stroke, stroke_width, G.S.arr_rgb_sign[owner_sign + 1]);
        },

        f_style_rect: function(unselected_selected, stroke_width = 1) {
            var fill = G.S.arr_rgb_unselected_selected[unselected_selected ? 1 : 0];
            return new G.F_STYLE(G.S.rgb_cell_border, stroke_width, fill);
        },

        ratio_cell_stroke_width: 0.05,
        ratio_ball_in_cell: 0.8,
        ratio_round_corners: 0.2
    },

    //2d point (with x-coordinate and y-coordinate)
    F_XY: function (x,y) {this.x = x; this.y = y},

    //two points "a", "b", that define rectangle area ab
    F_AB: function (a,b) {this.a = new G.F_XY(a.x, a.y); this.b = new G.F_XY(b.x, b.y)},

    //style of SVG element (stroke, stroke_width, fill)
    F_STYLE: function (stroke = "black", stroke_width = 1, fill = "gray") {
        this.stroke = stroke;
        this.fill = fill;
        this.stroke_width = stroke_width;
    },

    RULES: {
        arr_position: [],

        f_n_to_xy: function (n) {
            var nx = n % G.S.NX;
            var ny = (n - nx) / G.S.NX;
            return new G.F_XY(nx, ny);
        },

        f_xy_to_n: function (cell_xy) {
            return cell_xy.x + cell_xy.y * G.S.NX;
        },

        f_n_zero_cell: function (arr_position) {
            for (var i = 0; i < arr_position.length; i++) {
                if (!arr_position[i]) {return i;}
            }
        },

        f_is_n_cell_selected: function (arr_position, n_checking_cell) {
            var zero_xy = G.RULES.f_n_to_xy(G.RULES.f_n_zero_cell(arr_position));
            var checking_xy = G.RULES.f_n_to_xy(n_checking_cell);
            var dx = checking_xy.x - zero_xy.x;
            var dy = checking_xy.y - zero_xy.y;
            
            if (dy === 0) {return (Math.abs(dx) === 1); }

            if (dx === 0) {dy = Math.abs(dy); return (dy === 2) || (dy === 3); }
            return false;
        },

        f_next_position: function (arr_position, n_moving_cell) {
            var arr_copy = arr_position.slice();
            if (!G.RULES.f_is_n_cell_selected(arr_position, n_moving_cell)) {
                return arr_copy;
            }
            var zero_n = G.RULES.f_n_zero_cell(arr_position);
            var zero_xy = G.RULES.f_n_to_xy(zero_n);
            var checking_xy = G.RULES.f_n_to_xy(n_moving_cell);
            var dx = checking_xy.x - zero_xy.x;
            var dy = checking_xy.y - zero_xy.y;

            if (dy === 0) {
                arr_copy[zero_n] = arr_position[n_moving_cell] * (-1);
                arr_copy[n_moving_cell] = 0;
                return arr_copy;
            }

            arr_copy[zero_n] = arr_position[n_moving_cell];
            arr_copy[n_moving_cell] = 0; 

            var y_min =  Math.min(checking_xy.y, zero_xy.y) + 1;
            var y_max =  Math.max(checking_xy.y, zero_xy.y) - 1;
            for (var iy = y_min; iy <= y_max; iy++) {
                arr_copy[iy * G.S.NX + zero_xy.x] *= (-1);
            }

            return arr_copy;
        }
    },

    //element SVG by ID and f_add_html
    EL: {
        //main SVG gameArea
        SVG: document.getElementById("id_main_svg"),
        //add content to innerHTML element
        f_add_html: function (gotten_html = "", gotten_el = G.EL.SVG) {
            gotten_el.innerHTML = gotten_el.innerHTML + gotten_html;
        }
    },

    //output figures to SVG element
    DRAW: {
        //circle with center c00, radius r and (stroke, line_width, fill)
        f_cicrle: function (c00, r, obj_style) {
            var my_string = '<circle cx="' + c00.x + '" cy="' + c00.y + '" r="' + r + '"';
            return my_string + " " + obj_style.f_get_string(true) + ' " />';
        },

        //rectengle by opposite corners, rounr_radius and (stroke, line_width, fill)
        f_rect: function (ab, round_x, obj_style, id_index_cell = undefined) {
            var w = ab.b.x - ab.a.x; var h = ab.b.y - ab.a.y;
            var my_string = '<rect x="' + ab.a.x + '" y="' + ab.a.y;
            my_string = my_string + '" width="' + w + '" height="' + h + '" rx="' + round_x + '"';
            return my_string + " " + obj_style.f_get_string(true) + ' />';
        },

        f_cell: function (ab, ratio_round_x, sign_owner, is_selected) {
            var min_side = ab.f_get_min_side();
            var r_ball = min_side * 0.5 * G.S.ratio_ball_in_cell;
            var round_x = ratio_round_x * min_side;

            var stroke_width = min_side * G.S.ratio_cell_stroke_width;

            var style_visible = G.S.f_style_rect(is_selected, stroke_width);
            var svg_rect_visible = G.DRAW.f_rect(ab, round_x, style_visible);
            var svg_circle =  G.DRAW.f_cicrle(ab.f_get_center(), r_ball, G.S.f_style_ball(sign_owner, stroke_width));

            return svg_rect_visible + svg_circle;
        },

        f_sub_cell_area: function (ix ,iy) {
            //SVG - sizes
            var w = G.EL.SVG.clientWidth;
            var h = G.EL.SVG.clientHeight;
            var ab_total_no_cut = G.F_AB.f_by_m22([[0, 0], [w, h]]);
            var stroke_width = Math.min(w / G.S.NX, h / G.S.NY) * G.S.ratio_cell_stroke_width;

            var c00 = ab_total_no_cut.f_get_center();
            var new_wh = new G.F_XY(w - stroke_width, h - stroke_width);
            var ab_total = G.F_AB.f_by_c00_wh(c00, new_wh);

            return ab_total.f_sub_rect(new G.F_XY(ix, iy), new G.F_XY(G.S.NX, G.S.NY));
        },

        f_is_mouse_in_cell_n: function (px, py, n) {
            var nxy = G.RULES.f_n_to_xy(n);
            var ab = G.DRAW.f_sub_cell_area(nxy.x, nxy.y);
            return ((ab.a.x <= px) && (px < ab.b.x) && (ab.a.y <= py) && (py < ab.b.y))
        },
        
        //draw all sticks
        f_position_final: function(arr_position = G.RULES.arr_position.slice()) {
            var svg_all_cells = "", i_n, i_sign, i_select, i_id, i_ab;

            for (var iy = 0; iy < G.S.NY; iy++) {
                for (var ix = 0; ix < G.S.NX; ix++) {
                    i_n = G.RULES.f_xy_to_n(new G.F_XY(ix, iy));
                    i_sign = arr_position[i_n];
                    i_select = G.RULES.f_is_n_cell_selected(arr_position, i_n);
                    i_ab = G.DRAW.f_sub_cell_area(ix, iy);
                    svg_all_cells += G.DRAW.f_cell(i_ab, G.S.ratio_round_corners, i_sign, i_select);
                }
            }

            G.EL.SVG.innerHTML = "";
            G.EL.f_add_html(svg_all_cells);
        }
    }
};

(function f_set_prototypes() {
    G.F_AB.f_by_m22 = function (m22) {
        return new G.F_AB(new G.F_XY(m22[0][0], m22[0][1]), new G.F_XY(m22[1][0], m22[1][1]));
    }

    G.F_AB.f_by_c00_wh = function (c, wh) {
        var d = new G.F_XY(wh.x * 0.5, wh.y * 0.5);
        var m22 = [[c.x - d.x, c.y - d.y],[c.x + d.x, c.y + d.y]];
        return G.F_AB.f_by_m22(m22);
    }

    G.F_AB.prototype.f_get_min_side = function () {
        return Math.min(this.b.x - this.a.x, this.b.y - this.a.y);
    }

    G.F_AB.prototype.f_get_center = function () {
        return new G.F_XY((this.b.x + this.a.x) * 0.5, (this.b.y + this.a.y) * 0.5);
    }

    G.F_AB.prototype.f_sub_rect = function (nxy, nxy_total) {
        var zero = new G.F_XY(this.a.x, this.a.y);
        var step = new G.F_XY((this.b.x - this.a.x) / nxy_total.x, (this.b.y - this.a.y) / nxy_total.y);
        zero.x += step.x * nxy.x;
        zero.y += step.y * nxy.y;
        var opposite = new G.F_XY(zero.x + step.x, zero.y + step.y);
        return new G.F_AB(zero, opposite);
    }

    G.F_AB.prototype.f_cut_rect = function (t = 0) {
        return G.F_AB.f_by_m22([[this.a.x + t, this.a.y + t], [this.b.x - t, this.b.y - t]]);
    }

    G.F_STYLE.prototype.f_get_string = function(with_fill_or_only_stroke = true) {
        var stroke = 'stroke="' + this.stroke + '"';
        var stroke_width = 'stroke-width="' + this.stroke_width + '"';
        var fill = with_fill_or_only_stroke ? ('fill="' + this.fill + '"') : "";

        return stroke + ' ' + stroke_width + ' ' + fill;
    }
}());

(function f_test() {
    G.RULES.arr_position = G.S.arr_start_position.slice();
    G.DRAW.f_position_final(G.RULES.arr_position);


    function f_press_n_cell(n) {
        G.RULES.arr_position = G.RULES.f_next_position(G.RULES.arr_position, n);
        G.DRAW.f_position_final(G.RULES.arr_position);
    }

    function f_press_px_py(px, py) {
        for (var i_cell = 0; i_cell < G.RULES.arr_position.length; i_cell ++) {
            if (G.DRAW.f_is_mouse_in_cell_n(px, py, i_cell)) {
                f_press_n_cell(i_cell);
                return;
            }
        }
    }


    function f_get_coords(elem = G.EL.SVG) {
        let box = elem.getBoundingClientRect();
        return new G.F_XY(box.left + window.pageXOffset, box.top + window.pageYOffset);
    }

    window.onresize = function () {
        G.DRAW.f_position_final(G.RULES.arr_position);
    }

    G.EL.SVG.onclick = function(e) {
        var svg_xy = f_get_coords();
        f_press_px_py(e.pageX - svg_xy.x, e.pageY - svg_xy.y);
    };
}());