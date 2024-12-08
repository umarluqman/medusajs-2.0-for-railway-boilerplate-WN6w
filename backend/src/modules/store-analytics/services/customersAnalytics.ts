/*
 * Copyright 2024 RSC-Labs, https://rsoftcon.com/
 *
 * MIT License
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { OrderStatus } from "@medusajs/types";
import { calculateResolution } from "../utils/dateTransformations";
import { PgConnectionType } from "../utils/types";

type CustomersHistory = {
  customerCount: string;
  date: string;
};

export type CustomersHistoryResult = {
  dateRangeFrom?: number;
  dateRangeTo?: number;
  dateRangeFromCompareTo?: number;
  dateRangeToCompareTo?: number;
  current: CustomersHistory[];
  previous: CustomersHistory[];
};

type CustomersCounts = {
  dateRangeFrom?: number;
  dateRangeTo?: number;
  dateRangeFromCompareTo?: number;
  dateRangeToCompareTo?: number;
  current: number;
  previous: number;
};

type Distributions = {
  returnCustomerRate?: number;
  orderOneTimeFrequency?: number;
  orderRepeatFrequency?: number;
};

type CustomersOrdersDistribution = {
  dateRangeFrom?: number;
  dateRangeTo?: number;
  dateRangeFromCompareTo?: number;
  dateRangeToCompareTo?: number;
  current: Distributions;
  previous: Distributions;
};

type CustomersRetentionRate = {
  dateRangeFrom?: number;
  dateRangeTo?: number;
  dateRangeFromCompareTo?: number;
  dateRangeToCompareTo?: number;
  current: number;
  previous: number;
};

type InjectedDependencies = {
  __pg_connection__: PgConnectionType;
};

export default class CustomersAnalyticsService {
  protected pgConnection: PgConnectionType;

  constructor({ __pg_connection__ }: InjectedDependencies) {
    this.pgConnection = __pg_connection__;
  }

  async getHistory(
    from?: Date,
    to?: Date,
    dateRangeFromCompareTo?: Date,
    dateRangeToCompareTo?: Date
  ): Promise<CustomersHistoryResult> {
    if (dateRangeFromCompareTo && from && to && dateRangeToCompareTo) {
      const resolution = calculateResolution(from);
      const customers = await this.pgConnection
        .select([
          this.pgConnection.raw(
            `CASE 
              WHEN customer.created_at < ? AND customer.created_at >= ? THEN 'previous' 
              ELSE 'current' 
             END AS type`,
            [from, dateRangeFromCompareTo]
          ),
          this.pgConnection.raw(`date_trunc(?, customer.created_at) AS date`, [
            resolution,
          ]),
          this.pgConnection.raw(`COUNT(customer.id) AS customerCount`),
        ])
        .from("customer")
        .where("customer.created_at", ">=", dateRangeFromCompareTo)
        .groupBy(["type", "date"])
        .orderBy([
          { column: "date", order: "ASC" },
          { column: "type", order: "ASC" },
        ]);

      const finalCustomers: CustomersHistoryResult = customers.reduce(
        (acc, entry) => {
          const type = entry.type;
          const date = entry.date;
          const customerCount = entry.customercount;
          if (!acc[type]) {
            acc[type] = [];
          }

          acc[type].push({ date, customerCount });

          return acc;
        },
        {}
      );

      return {
        dateRangeFrom: from.getTime(),
        dateRangeTo: to.getTime(),
        dateRangeFromCompareTo: dateRangeFromCompareTo.getTime(),
        dateRangeToCompareTo: dateRangeToCompareTo.getTime(),
        current: finalCustomers.current ? finalCustomers.current : [],
        previous: finalCustomers.previous ? finalCustomers.previous : [],
      };
    }

    let startQueryFrom: Date | undefined;
    if (!dateRangeFromCompareTo) {
      if (from) {
        startQueryFrom = from;
      } else {
        const lastCustomer = await this.pgConnection("customer")
          .select("created_at")
          .orderBy("created_at", "ASC")
          .first();

        if (lastCustomer) {
          startQueryFrom = lastCustomer.created_at;
        }
      }
    } else {
      startQueryFrom = dateRangeFromCompareTo;
    }

    if (startQueryFrom) {
      const resolution = calculateResolution(startQueryFrom);
      const customers = await this.pgConnection("customer")
        .select([
          this.pgConnection.raw(`date_trunc(?, customer.created_at) AS date`, [
            resolution,
          ]),
          this.pgConnection.raw(`COUNT(customer.id) AS customerCount`),
        ])
        .where("customer.created_at", ">=", startQueryFrom)
        .groupBy("date")
        .orderBy("date", "ASC");

      const finalCustomers: CustomersHistory[] = customers.map((customer) => {
        const rawCustomer = customer as unknown as any;
        return {
          customerCount: rawCustomer.customercount,
          date: rawCustomer.date,
        };
      });

      return {
        dateRangeFrom: startQueryFrom.getTime(),
        dateRangeTo: to ? to.getTime() : new Date(Date.now()).getTime(),
        dateRangeFromCompareTo: undefined,
        dateRangeToCompareTo: undefined,
        current: finalCustomers,
        previous: [],
      };
    }

    return {
      dateRangeFrom: undefined,
      dateRangeTo: undefined,
      dateRangeFromCompareTo: undefined,
      dateRangeToCompareTo: undefined,
      current: [],
      previous: [],
    };
  }

  async getNewCount(
    from?: Date,
    to?: Date,
    dateRangeFromCompareTo?: Date,
    dateRangeToCompareTo?: Date
  ): Promise<CustomersCounts> {
    let startQueryFrom: Date | undefined;
    if (!dateRangeFromCompareTo) {
      if (from) {
        startQueryFrom = from;
      } else {
        const lastCustomer = await this.pgConnection("customer")
          .select("created_at")
          .orderBy("created_at", "ASC")
          .first();

        if (lastCustomer) {
          startQueryFrom = lastCustomer.created_at;
        }
      }
    } else {
      startQueryFrom = dateRangeFromCompareTo;
    }
    const filterCondition: [string, string, Date] | null = startQueryFrom
      ? ["created_at", ">=", startQueryFrom]
      : null;

    const customersData = await this.pgConnection("customer")
      .select(["id", "created_at", "updated_at"])
      .modify((queryBuilder) => {
        if (filterCondition) {
          queryBuilder.where(...filterCondition);
        }
      })
      .orderBy("created_at", "DESC");

    const customersCount = await this.pgConnection("customer")
      .count({ count: "*" })
      .modify((queryBuilder) => {
        if (filterCondition) {
          queryBuilder.where(...filterCondition);
        }
      })
      .first();

    const totalCustomersCount = parseInt(customersCount?.count || "0", 10);

    const customers = [customersData, totalCustomersCount];

    if (dateRangeFromCompareTo && from && to && dateRangeToCompareTo) {
      const previousCustomers = customers[0].filter(
        (customer) => customer.created_at < from
      );
      const currentCustomers = customers[0].filter(
        (customer) => customer.created_at >= from
      );
      return {
        dateRangeFrom: from.getTime(),
        dateRangeTo: to.getTime(),
        dateRangeFromCompareTo: dateRangeFromCompareTo.getTime(),
        dateRangeToCompareTo: dateRangeToCompareTo.getTime(),
        current: currentCustomers.length,
        previous: previousCustomers.length,
      };
    }

    if (startQueryFrom && customers.length > 0) {
      return {
        dateRangeFrom: startQueryFrom.getTime(),
        dateRangeTo: to ? to.getTime() : new Date(Date.now()).getTime(),
        dateRangeFromCompareTo: undefined,
        dateRangeToCompareTo: undefined,
        current: customers[1],
        previous: 0,
      };
    }

    return {
      dateRangeFrom: undefined,
      dateRangeTo: undefined,
      dateRangeFromCompareTo: undefined,
      dateRangeToCompareTo: undefined,
      current: 0,
      previous: 0,
    };
  }

  async getNumberOfReturningCustomers(): Promise<number> {
    const customersData = await this.pgConnection("customer")
      .where("orders", ">", 1)
      .count({ count: "*" })
      .first();

    const totalCustomersCount =
      parseInt(customersData?.count as string, 10) || 0;

    return totalCustomersCount;
  }

  async getRepeatCustomerRate(
    orderStatuses: OrderStatus[],
    from?: Date,
    to?: Date,
    dateRangeFromCompareTo?: Date,
    dateRangeToCompareTo?: Date
  ): Promise<CustomersOrdersDistribution> {
    // Use the same query like finding for Orders, but include Customers
    let startQueryFrom: Date | undefined;
    const orderStatusesAsStrings = Object.values(orderStatuses);
    if (orderStatusesAsStrings.length) {
      if (!dateRangeFromCompareTo) {
        if (from) {
          startQueryFrom = from;
        } else {
          const lastOrder = await this.pgConnection("order")
            .select("created_at")
            .whereIn("status", orderStatusesAsStrings)
            .orderBy("created_at", "ASC")
            .limit(1)
            .then((result) => result[0]);

          if (lastOrder) {
            startQueryFrom = lastOrder.created_at;
          }
        }
      } else {
        startQueryFrom = dateRangeFromCompareTo;
      }
      const orders = await this.pgConnection("order")
        .select(["id", "created_at", "updated_at", "customer_id"])
        .whereIn("status", orderStatusesAsStrings)
        .andWhere("created_at", ">=", startQueryFrom)
        .orderBy("created_at", "DESC")
        .then((result) => result);

      if (dateRangeFromCompareTo && from && to && dateRangeToCompareTo) {
        const previousOrders = orders.filter(
          (order) => order.created_at < from
        );
        const currentOrders = orders.filter(
          (order) => order.created_at >= from
        );

        const previousOrderCountByCustomer: Map<string, number> =
          previousOrders.reduce((acc, order) => {
            acc[order.customer_id] = (acc[order.customer_id] || 0) + 1;
            return acc;
          }, new Map<string, number>());

        const currentOrderCountByCustomer: Map<string, number> =
          currentOrders.reduce((acc, order) => {
            acc[order.customer_id] = (acc[order.customer_id] || 0) + 1;
            return acc;
          }, new Map<string, number>());

        const returningCustomersForCurrentOrders = Object.values(
          currentOrderCountByCustomer
        ).filter((count) => parseInt(count) > 1).length;
        const totalCustomersForCurrentOrders = Object.keys(
          currentOrderCountByCustomer
        ).length;

        const returningCustomersForPreviousOrders = Object.values(
          previousOrderCountByCustomer
        ).filter((count) => parseInt(count) > 1).length;
        const totalCustomersForPreviousOrders = Object.keys(
          previousOrderCountByCustomer
        ).length;

        // Return Customer Rate
        const returnCustomerRateCurrentValue =
          totalCustomersForCurrentOrders > 0
            ? (returningCustomersForCurrentOrders * 100) /
              totalCustomersForCurrentOrders
            : undefined;
        const returnCustomerRatePreviousValue =
          totalCustomersForPreviousOrders > 0
            ? (returningCustomersForPreviousOrders * 100) /
              totalCustomersForPreviousOrders
            : undefined;

        // Order frequency distribution
        let currentOneTimeOrders = 0;
        let currentRepeatOrders = 0;
        for (const count of Object.values(currentOrderCountByCustomer)) {
          if (parseInt(count) === 1) {
            currentOneTimeOrders += count;
          } else if (parseInt(count) > 1) {
            currentRepeatOrders += count;
          }
        }

        let previousOneTimeOrders = 0;
        let previousRepeatOrders = 0;
        for (const count of Object.values(previousOrderCountByCustomer)) {
          if (parseInt(count) === 1) {
            previousOneTimeOrders += count;
          } else if (parseInt(count) > 1) {
            previousRepeatOrders += count;
          }
        }
        return {
          dateRangeFrom: from.getTime(),
          dateRangeTo: to.getTime(),
          dateRangeFromCompareTo: dateRangeFromCompareTo.getTime(),
          dateRangeToCompareTo: dateRangeToCompareTo.getTime(),
          current: {
            returnCustomerRate: returnCustomerRateCurrentValue,
            orderOneTimeFrequency:
              (currentOneTimeOrders * 100) / currentOrders.length,
            orderRepeatFrequency:
              (currentRepeatOrders * 100) / currentOrders.length,
          },
          previous: {
            returnCustomerRate: returnCustomerRatePreviousValue,
            orderOneTimeFrequency:
              (previousOneTimeOrders * 100) / previousOrders.length,
            orderRepeatFrequency:
              (previousRepeatOrders * 100) / previousOrders.length,
          },
        };
      }

      if (startQueryFrom) {
        const orderCountByCustomer: Map<string, number> = orders.reduce(
          (acc, order) => {
            acc[order.customer_id] = (acc[order.customer_id] || 0) + 1;
            return acc;
          },
          new Map<string, number>()
        );

        const returningCustomersForCurrentOrders = Object.values(
          orderCountByCustomer
        ).filter((count) => parseInt(count) > 1).length;

        const totalCustomersForCurrentOrders =
          Object.keys(orderCountByCustomer).length;
        // Return Customer Rate
        const returnCustomerRateCurrentValue =
          totalCustomersForCurrentOrders > 0
            ? (returningCustomersForCurrentOrders * 100) /
              totalCustomersForCurrentOrders
            : undefined;

        // Order frequency distribution
        let currentOneTimeOrders = 0;
        let currentRepeatOrders = 0;
        for (const count of Object.values(orderCountByCustomer)) {
          if (parseInt(count) === 1) {
            currentOneTimeOrders += count;
          } else if (parseInt(count) > 1) {
            currentRepeatOrders += count;
          }
        }

        return {
          dateRangeFrom: startQueryFrom.getTime(),
          dateRangeTo: to ? to.getTime() : new Date(Date.now()).getTime(),
          dateRangeFromCompareTo: undefined,
          dateRangeToCompareTo: undefined,
          current: {
            returnCustomerRate: returnCustomerRateCurrentValue,
            orderOneTimeFrequency: (currentOneTimeOrders * 100) / orders.length,
            orderRepeatFrequency: (currentRepeatOrders * 100) / orders.length,
          },
          previous: undefined,
        };
      }
    }
    return {
      dateRangeFrom: undefined,
      dateRangeTo: undefined,
      dateRangeFromCompareTo: undefined,
      dateRangeToCompareTo: undefined,
      current: {
        returnCustomerRate: 0,
      },
      previous: {
        returnCustomerRate: 0,
      },
    };
  }
  async getCumulativeHistory(
    from?: Date,
    to?: Date,
    dateRangeFromCompareTo?: Date,
    dateRangeToCompareTo?: Date
  ): Promise<CustomersHistoryResult> {
    if (dateRangeFromCompareTo && from && to && dateRangeToCompareTo) {
      const resolution = calculateResolution(from);
      const afterCustomers = await this.pgConnection("customer")
        .select([
          this.pgConnection.raw(`date_trunc(?, customer.created_at) AS date`, [
            resolution,
          ]),
          this.pgConnection.raw(`COUNT(customer.id) AS customerCount`),
        ])
        .where("customer.created_at", ">=", dateRangeFromCompareTo)
        .groupBy("date")
        .orderBy("date", "ASC");

      let cumulativeCount = 0;
      const customersWithCumulativeCount = afterCustomers.map((customer) => {
        const row = customer as unknown as any;
        cumulativeCount += parseInt(row.customercount); // Add current count to cumulative sum
        return {
          ...row,
          cumulative_count: cumulativeCount,
        };
      });

      const beforeCustomers = await this.pgConnection("customer")
        .count({ cumulative_count: "*" })
        .where("created_at", "<", dateRangeFromCompareTo)
        .first();

      // Start from 0 as customer count will be added from beforeCustomers, so first entry will include past count
      customersWithCumulativeCount.push({
        date: dateRangeFromCompareTo,
        cumulative_count: "0",
      });

      for (const customerWithCumulativeCount of customersWithCumulativeCount) {
        customerWithCumulativeCount.cumulative_count = parseInt(
          customerWithCumulativeCount.cumulative_count
        );
        customerWithCumulativeCount.cumulative_count += parseInt(
          beforeCustomers.cumulative_count
        );
      }

      const previousCustomers = customersWithCumulativeCount.filter(
        (customer) => customer.date < from
      );
      const currentCustomers = customersWithCumulativeCount.filter(
        (customer) => customer.date >= from
      );

      const finalCustomers: CustomersHistoryResult = {
        dateRangeFrom: from.getTime(),
        dateRangeTo: to.getTime(),
        dateRangeFromCompareTo: dateRangeFromCompareTo.getTime(),
        dateRangeToCompareTo: dateRangeToCompareTo.getTime(),
        current: currentCustomers.map((currentCustomer) => {
          return {
            date: currentCustomer.date,
            customerCount: currentCustomer.cumulative_count.toString(),
          };
        }),
        previous: previousCustomers.map((previousCustomers) => {
          return {
            date: previousCustomers.date,
            customerCount: previousCustomers.cumulative_count.toString(),
          };
        }),
      };

      return finalCustomers;
    }
    let startQueryFrom: Date | undefined;
    if (!dateRangeFromCompareTo) {
      if (from) {
        startQueryFrom = from;
      } else {
        const lastCustomer = await this.pgConnection("customer")
          .select("created_at")
          .orderBy("created_at", "ASC")
          .first();

        if (lastCustomer) {
          startQueryFrom = lastCustomer.created_at;
        }
      }
    } else {
      startQueryFrom = dateRangeFromCompareTo;
    }

    if (startQueryFrom) {
      const resolution = calculateResolution(startQueryFrom);

      const afterCustomers = await this.pgConnection("customer")
        .select([
          this.pgConnection.raw(`date_trunc(?, customer.created_at) AS date`, [
            resolution,
          ]),
          this.pgConnection.raw(`COUNT(customer.id) AS customerCount`),
        ])
        .groupBy("date")
        .orderBy("date", "ASC");

      let cumulativeCount = 0;
      const customersWithCumulativeCount = afterCustomers.map((customer) => {
        const row = customer as unknown as any;
        cumulativeCount += parseInt(row.customercount); // Add current count to cumulative sum
        return {
          ...row,
          cumulative_count: cumulativeCount,
        };
      });

      const finalCustomers: CustomersHistoryResult = {
        dateRangeFrom: startQueryFrom.getTime(),
        dateRangeTo: to ? to.getTime() : new Date(Date.now()).getTime(),
        dateRangeFromCompareTo: undefined,
        dateRangeToCompareTo: undefined,
        current: customersWithCumulativeCount.map((currentCustomer) => {
          return {
            date: currentCustomer.date,
            customerCount: currentCustomer.cumulative_count.toString(),
          };
        }),
        previous: [],
      };

      return finalCustomers;
    }

    return {
      dateRangeFrom: undefined,
      dateRangeTo: undefined,
      dateRangeFromCompareTo: undefined,
      dateRangeToCompareTo: undefined,
      current: [],
      previous: [],
    };
  }

  // Customers which purchased something in the time period / Total customers
  async getRetentionRate(
    orderStatuses: OrderStatus[],
    from?: Date,
    to?: Date,
    dateRangeFromCompareTo?: Date,
    dateRangeToCompareTo?: Date
  ): Promise<CustomersRetentionRate> {
    // Use the same query like finding for Orders, but include Customers
    let startQueryFrom: Date | undefined;
    const orderStatusesAsStrings = Object.values(orderStatuses);
    if (orderStatusesAsStrings.length) {
      const totalNumberCustomers = await this.pgConnection("customer")
        .count("* as total")
        .then((result) => result[0].total);

      if (!dateRangeFromCompareTo) {
        if (from) {
          startQueryFrom = from;
        } else {
          const lastOrder = await this.pgConnection("order")
            .select("created_at")
            .whereIn("status", orderStatusesAsStrings)
            .orderBy("created_at", "ASC")
            .limit(1)
            .then((result) => result[0]);

          if (lastOrder) {
            startQueryFrom = lastOrder.created_at;
          }
        }
      } else {
        startQueryFrom = dateRangeFromCompareTo;
      }
      const orders = await this.pgConnection("order")
        .select(["id", "created_at", "updated_at", "customer_id"])
        .whereIn("status", orderStatusesAsStrings)
        .andWhere("created_at", ">=", startQueryFrom) // fallback to some distant past date if no startQueryFrom
        .orderBy("created_at", "DESC")
        .then((result) => result);

      if (dateRangeFromCompareTo && from && to && dateRangeToCompareTo) {
        const previousOrders = orders.filter(
          (order) => order.created_at < from
        );
        const currentOrders = orders.filter(
          (order) => order.created_at >= from
        );

        const previousCustomersSet: Set<string> = previousOrders.reduce(
          (acc, order) => {
            acc.add(order.customer_id);
            return acc;
          },
          new Set<string>()
        );

        const currentCustomersSet: Set<string> = currentOrders.reduce(
          (acc, order) => {
            acc.add(order.customer_id);
            return acc;
          },
          new Set<string>()
        );

        const retentionCustomerRatePreviousValue =
          (previousCustomersSet.size * 100) /
          parseInt(totalNumberCustomers.toString());
        const retentionCustomerRateCurrentValue =
          (currentCustomersSet.size * 100) /
          parseInt(totalNumberCustomers.toString());

        return {
          dateRangeFrom: from.getTime(),
          dateRangeTo: to.getTime(),
          dateRangeFromCompareTo: dateRangeFromCompareTo.getTime(),
          dateRangeToCompareTo: dateRangeToCompareTo.getTime(),
          current: retentionCustomerRateCurrentValue,
          previous: retentionCustomerRatePreviousValue,
        };
      }

      if (startQueryFrom) {
        const currentCustomersSet: Set<string> = orders.reduce((acc, order) => {
          acc.add(order.customer_id);
          return acc;
        }, new Set<string>());

        const retentionCustomerRateCurrentValue =
          (currentCustomersSet.size * 100) /
          parseInt(totalNumberCustomers.toString());

        return {
          dateRangeFrom: startQueryFrom.getTime(),
          dateRangeTo: to ? to.getTime() : new Date(Date.now()).getTime(),
          dateRangeFromCompareTo: undefined,
          dateRangeToCompareTo: undefined,
          current: retentionCustomerRateCurrentValue,
          previous: undefined,
        };
      }
    }
    return {
      dateRangeFrom: undefined,
      dateRangeTo: undefined,
      dateRangeFromCompareTo: undefined,
      dateRangeToCompareTo: undefined,
      current: undefined,
      previous: undefined,
    };
  }
}
