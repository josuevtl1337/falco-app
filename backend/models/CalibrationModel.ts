import db from "../db.ts";

export interface ICoffee {
  name: string;
  benefit: string;
  origin: string;
}

type Method = "espresso" | "filter";
type Evaluation = {
  saturation: number;
  balance: number;
  texture: number;
  finish: number;
};

export interface NewTast {
  coffee_id: number;
  method: Method;
  dose_g: number; // seco
  yield_g: number; // líquido en taza
  extraction_time_s: number; // segundos
  ratio_label: string; // ej. "1:2,00" que manda el front
  final_opinion?: string;
  fav?: boolean;
  evaluation: Evaluation;
}

type Calibrations = {
  id: number;
  coffee_id: string;
  coffee_name: string;
  created_at: string; // ISO
  method: Method;
  dose_g: number; // dose_g
  yield_g: number; // yield_g
  extraction_time_s: number; // extraction_time_s
  ratio_label: string; // "1:2,00"
  final_opinion?: string | null;
  fav: 0 | 1;
  sat: number;
  bal: number;
  tex: number;
  fin: number;
};

class CalibrationModel {
  public async getAllCoffees() {
    const data = db.prepare("SELECT * FROM coffees").all();
    return data;
  }

  public async addNewCoffee(coffee: ICoffee) {
    const { name, benefit, origin } = coffee;

    const data = db
      .prepare("INSERT INTO coffees (name, benefit, origin) VALUES (?, ?, ?)")
      .run(name, benefit, origin);
    return data;
  }

  public async addNewTasting(tast: NewTast) {
    const favInt = tast.fav ? 1 : 0;
    const { saturation, balance, texture, finish } = tast.evaluation;

    const data = db
      .prepare(
        `
    INSERT INTO calibrations
      (coffee_id, method, dose_g, yield_g, extraction_time_s,
       ratio_label, final_opinion, fav, sat, bal, tex, fin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
      )
      .run(
        tast.coffee_id,
        tast.method,
        tast.dose_g,
        tast.yield_g,
        tast.extraction_time_s,
        tast.ratio_label,
        tast.final_opinion ?? null,
        favInt,
        saturation,
        balance,
        texture,
        finish
      );

    return data;
  }

  // public async getAllCalibrations() {
  //   const items = db
  //     .prepare("SELECT * FROM calibrations cal JOIN coffees cof ON cof.id = cal.coffee_id ORDER BY cal.created_at DESC")
  //     .all() as Calibrations[];
  //   const { total } = db
  //     .prepare("SELECT COUNT(*) AS total FROM calibrations")
  //     .get() as { total: number };
  //   return { items, total };
  // }

  //     id: number;
  // coffee_id: string;
  //  coffee_name: string;
  // created_at: string; // ISO
  // method: Method;
  // dose_g: number; // dose_g
  // yield_g: number; // yield_g
  // extraction_time_s: number; // extraction_time_s
  // ratio_label: string; // "1:2,00"
  // final_opinion?: string | null;
  // fav: 0 | 1;
  // sat: number;
  // bal: number;
  // tex: number;
  // fin: number;

  public async getAllCalibrations() {
    const items = db
      .prepare(
        `
    SELECT
      cal.id,
      cal.coffee_id,
      cof.name  AS coffee_name,
      cal.created_at,
      cal.method,
      cal.dose_g ,
      cal.yield_g,
      cal.extraction_time_s,
      cof.benefit,
      cof.origin,
      cal.ratio_label,
      cal.final_opinion,
      cal.fav,
      cal.sat, cal.bal, cal.tex, cal.fin
    FROM calibrations cal
    JOIN coffees cof ON cof.id = cal.coffee_id
    ORDER BY cal.created_at DESC
  `
      )
      .all() as Calibrations[];

    const { total } = db
      .prepare(`SELECT COUNT(*) AS total FROM calibrations`)
      .get() as { total: number };

    return { items, total };
  }

  public async listCalibrations(params: {
    coffee_id?: number | undefined;
    method?: Method | undefined;
    fav?: boolean | undefined;
    date_from?: string | undefined; // "YYYY-MM-DD"
    date_to?: string | undefined; // "YYYY-MM-DD"
    page?: number | undefined; // 1-based
    per_page?: number | undefined; // default 20
  }) {
    const {
      coffee_id,
      method,
      fav,
      date_from,
      date_to,
      page = 1,
      per_page = 20,
    } = params || {};

    const where: string[] = [];
    const bind: any = {};

    if (coffee_id) {
      where.push("cal.coffee_id = @coffee_id");
      bind.coffee_id = coffee_id;
    }
    if (method) {
      where.push("cal.method = @method");
      bind.method = method;
    }
    if (fav) {
      where.push("cal.fav = 1");
    }
    if (date_from) {
      where.push("cal.created_at >= @from");
      bind.from = `${date_from} 00:00:00`;
    }
    if (date_to) {
      where.push("cal.created_at <= @to");
      bind.to = `${date_to} 23:59:59`;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const limit = Math.min(per_page || 20, 100);
    const offset = (Math.max(page || 1, 1) - 1) * limit;

    const items = db
      .prepare(
        `
    SELECT
      cal.id,
      cal.created_at,
      cal.coffee_id,
      cof.name  AS coffee_name,
      cof.benefit,
      cof.origin,
      cal.method,
      cal.dose_g,
      cal.yield_g,
      cal.extraction_time_s,
      cal.ratio_label,
      cal.final_opinion,
      cal.fav,
      cal.sat, cal.bal, cal.tex, cal.fin
    FROM calibrations cal
    JOIN coffees cof ON cof.id = cal.coffee_id
    ${whereSql}
    ORDER BY cal.created_at DESC
    LIMIT @limit OFFSET @offset
  `
      )
      .all({ ...bind, limit, offset });

    const total = db
      .prepare(
        `
    SELECT COUNT(*) AS c
    FROM calibrations cal
    JOIN coffees cof ON cof.id = cal.coffee_id
    ${whereSql}
  `
      )
      .get(bind).c as number;

    return { items, total };
  }
}

export default new CalibrationModel();
