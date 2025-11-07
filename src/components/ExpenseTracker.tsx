"use client";

import React, { useState } from "react";
import {
  Paper,
  Stack,
  Group,
  Text,
  Title,
  Button,
  Badge,
  TextInput,
  Card,
  Divider,
  Loader,
  Alert,
  SimpleGrid,
  Box,
  Progress,
} from "@mantine/core";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Save,
  Wallet,
} from "lucide-react";
import { notifications } from "@mantine/notifications";
import {
  getExpenseRecommendations,
  type ExpensePlan,
  type ApiKeyStatus,
} from "../utils/aiUtils";

interface ExpenseTrackerProps {
  apiKeyStatuses: ApiKeyStatus[];
}

const COLORS = [
  "#176B87", // Dark teal - Housing/Rent
  "#86B6F6", // Light blue - Utilities
  "#2E86AB", // Blue - Food/Groceries
  "#1E90FF", // Dodger blue - Transportation
  "#4169E1", // Royal blue - Healthcare
  "#6495ED", // Cornflower blue - Insurance
  "#87CEEB", // Sky blue - Personal Care
  "#4682B4", // Steel blue - Entertainment
  "#5F9EA0", // Cadet blue - Subscriptions
  "#20B2AA", // Light sea green - Savings
  "#32CD32", // Lime green - Emergency Fund
];

const PRIORITY_COLORS = {
  essential: "#DC143C",
  important: "#FF8C00",
  optional: "#32CD32",
};

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ apiKeyStatuses }) => {
  const [netSalary, setNetSalary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [expensePlan, setExpensePlan] = useState<ExpensePlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetRecommendations = async () => {
    const salary = parseFloat(netSalary);
    if (!salary || salary <= 0) {
      notifications.show({
        title: "Invalid Input",
        message: "Please enter a valid net salary amount",
        color: "red",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const plan = await getExpenseRecommendations(salary, apiKeyStatuses);
      setExpensePlan(plan);
      notifications.show({
        title: "Success!",
        message: "Expense plan generated successfully",
        color: "green",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate recommendations";
      setError(errorMessage);
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare data for pie chart (expenses breakdown)
  const getPieChartData = () => {
    if (!expensePlan) return [];
    return [
      ...expensePlan.expenses.map((exp) => ({
        name: exp.category,
        value: exp.recommendedAmount,
        percentage: exp.percentage,
      })),
      {
        name: "Savings",
        value: expensePlan.savings.recommendedAmount,
        percentage: expensePlan.savings.percentage,
      },
      {
        name: "Emergency Fund",
        value: expensePlan.emergencyFund.recommendedAmount,
        percentage: expensePlan.emergencyFund.percentage,
      },
    ];
  };

  // Prepare data for bar chart (expenses by priority)
  const getBarChartData = () => {
    if (!expensePlan) return [];
    const priorityGroups: Record<string, number> = {};
    expensePlan.expenses.forEach((exp) => {
      priorityGroups[exp.priority] =
        (priorityGroups[exp.priority] || 0) + exp.recommendedAmount;
    });
    return [
      {
        name: "Essential",
        amount: priorityGroups.essential || 0,
        color: PRIORITY_COLORS.essential,
      },
      {
        name: "Important",
        amount: priorityGroups.important || 0,
        color: PRIORITY_COLORS.important,
      },
      {
        name: "Optional",
        amount: priorityGroups.optional || 0,
        color: PRIORITY_COLORS.optional,
      },
      {
        name: "Savings",
        amount: expensePlan.savings.recommendedAmount,
        color: "#1E90FF",
      },
      {
        name: "Emergency Fund",
        amount: expensePlan.emergencyFund.recommendedAmount,
        color: "#32CD32",
      },
    ];
  };

  // Prepare data for horizontal bar chart (top expenses)
  const getTopExpensesData = () => {
    if (!expensePlan) return [];
    return [...expensePlan.expenses]
      .sort((a, b) => b.recommendedAmount - a.recommendedAmount)
      .slice(0, 8)
      .map((exp) => ({
        name: exp.category,
        amount: exp.recommendedAmount,
        percentage: exp.percentage,
      }));
  };

  const pieData = getPieChartData();
  const barData = getBarChartData();
  const topExpensesData = getTopExpensesData();

  return (
    <Stack gap="lg">
      {/* Header Card */}
      <Card
        shadow="lg"
        radius="lg"
        style={{
          backgroundColor: "white",
          border: "1px solid #86B6F6",
        }}
        p="xl"
      >
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs">
              <Title
                order={2}
                style={{
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                  fontWeight: 700,
                }}
              >
                Expense Tracker & Budget Planner
              </Title>
              <Text
                size="sm"
                style={{
                  color: "#176B87",
                  opacity: 0.8,
                  fontFamily: "Inter Tight, sans-serif",
                }}
              >
                Enter your net salary and get AI-powered expense recommendations
                with savings plan
              </Text>
            </Stack>
          </Group>

          <Divider color="#86B6F6" />

          {/* Salary Input */}
          <Group align="flex-end" gap="md">
            <TextInput
              label="Net Monthly Salary"
              placeholder="Enter your net salary (e.g., 5000)"
              value={netSalary}
              onChange={(e) => setNetSalary(e.target.value)}
              type="number"
              leftSection={<DollarSign size={18} color="#176B87" />}
              style={{ flex: 1 }}
              radius="lg"
              size="md"
              styles={{
                label: {
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                  fontWeight: 600,
                },
                input: {
                  borderColor: "#86B6F6",
                  fontFamily: "Inter Tight, sans-serif",
                  "&:focus": {
                    borderColor: "#176B87",
                  },
                },
              }}
            />
            <Button
              onClick={handleGetRecommendations}
              disabled={isLoading || !netSalary}
              style={{
                backgroundColor: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
              }}
              radius="lg"
              size="md"
              leftSection={isLoading ? <Loader size={16} /> : <Lightbulb size={18} />}
            >
              {isLoading ? "Generating..." : "Get Recommendations"}
            </Button>
          </Group>

          {error && (
            <Alert
              icon={<AlertCircle size={16} />}
              title="Error"
              color="red"
              radius="lg"
            >
              {error}
            </Alert>
          )}
        </Stack>
      </Card>

      {expensePlan && (
        <>
          {/* Summary Cards */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            <Card
              shadow="sm"
              radius="lg"
              style={{
                background:
                  "linear-gradient(135deg, #B4D4FF 0%, #86B6F6 100%)",
                border: "1px solid #86B6F6",
              }}
              p="md"
            >
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text
                    size="sm"
                    style={{
                      color: "#176B87",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Net Salary
                  </Text>
                  <Wallet size={20} color="#176B87" />
                </Group>
                <Text
                  size="xl"
                  style={{
                    color: "#176B87",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 700,
                  }}
                >
                  ${expensePlan.salary.toLocaleString()}
                </Text>
              </Stack>
            </Card>

            <Card
              shadow="sm"
              radius="lg"
              style={{
                background:
                  "linear-gradient(135deg, #FFE4E1 0%, #FFB6C1 100%)",
                border: "1px solid #DC143C",
              }}
              p="md"
            >
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text
                    size="sm"
                    style={{
                      color: "#DC143C",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Total Expenses
                  </Text>
                  <DollarSign size={20} color="#DC143C" />
                </Group>
                <Text
                  size="xl"
                  style={{
                    color: "#DC143C",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 700,
                  }}
                >
                  ${expensePlan.totalExpenses.toLocaleString()}
                </Text>
                <Text
                  size="xs"
                  style={{
                    color: "#DC143C",
                    opacity: 0.8,
                    fontFamily: "Inter Tight, sans-serif",
                  }}
                >
                  {(
                    (expensePlan.totalExpenses / expensePlan.salary) *
                    100
                  ).toFixed(1)}
                  % of salary
                </Text>
              </Stack>
            </Card>

            <Card
              shadow="sm"
              radius="lg"
              style={{
                background:
                  "linear-gradient(135deg, #E0F7E0 0%, #90EE90 100%)",
                border: "1px solid #32CD32",
              }}
              p="md"
            >
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text
                    size="sm"
                    style={{
                      color: "#228B22",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Total Savings
                  </Text>
                  <Save size={20} color="#228B22" />
                </Group>
                <Text
                  size="xl"
                  style={{
                    color: "#228B22",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 700,
                  }}
                >
                  $
                  {(
                    expensePlan.savings.recommendedAmount +
                    expensePlan.emergencyFund.recommendedAmount
                  ).toLocaleString()}
                </Text>
                <Text
                  size="xs"
                  style={{
                    color: "#228B22",
                    opacity: 0.8,
                    fontFamily: "Inter Tight, sans-serif",
                  }}
                >
                  {(
                    ((expensePlan.savings.recommendedAmount +
                      expensePlan.emergencyFund.recommendedAmount) /
                      expensePlan.salary) *
                    100
                  ).toFixed(1)}
                  % of salary
                </Text>
              </Stack>
            </Card>

            <Card
              shadow="sm"
              radius="lg"
              style={{
                background:
                  "linear-gradient(135deg, #E6F3FF 0%, #B4D4FF 100%)",
                border: "1px solid #1E90FF",
              }}
              p="md"
            >
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text
                    size="sm"
                    style={{
                      color: "#176B87",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Remaining
                  </Text>
                  <TrendingUp size={20} color="#176B87" />
                </Group>
                <Text
                  size="xl"
                  style={{
                    color: "#176B87",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 700,
                  }}
                >
                  ${expensePlan.remaining.toLocaleString()}
                </Text>
                <Text
                  size="xs"
                  style={{
                    color: "#176B87",
                    opacity: 0.8,
                    fontFamily: "Inter Tight, sans-serif",
                  }}
                >
                  {((expensePlan.remaining / expensePlan.salary) * 100).toFixed(
                    1
                  )}
                  % of salary
                </Text>
              </Stack>
            </Card>
          </SimpleGrid>

          {/* Charts Section */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {/* Pie Chart */}
            <Card
              shadow="lg"
              radius="xl"
              style={{
                backgroundColor: "white",
                border: "1px solid #86B6F6",
              }}
              p="xl"
            >
              <Stack gap="md">
                <Title
                  order={3}
                  style={{
                    color: "#176B87",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 700,
                  }}
                >
                  Budget Distribution
                </Title>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(entry: any) => {
                        // Only show labels for slices larger than 3% to avoid clutter
                        const percentage = entry?.percentage || 0;
                        if (percentage >= 3) {
                          return `${percentage.toFixed(1)}%`;
                        }
                        return "";
                      }}
                      outerRadius={120}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any, props: any) => {
                        const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                        const percentage = props?.payload?.percentage || 0;
                        return [
                          `$${numValue.toLocaleString()} (${percentage.toFixed(1)}%)`,
                          props?.payload?.name || name || 'Category',
                        ];
                      }}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #86B6F6",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontFamily: "Inter Tight, sans-serif",
                        fontSize: "12px",
                      }}
                      labelStyle={{
                        color: "#176B87",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={80}
                      iconType="circle"
                      formatter={(value: string, entry: any) => {
                        const dataItem = pieData.find((d) => d.name === value);
                        if (dataItem) {
                          return `${value}: ${dataItem.percentage.toFixed(1)}%`;
                        }
                        return value;
                      }}
                      wrapperStyle={{
                        paddingTop: "20px",
                        fontFamily: "Inter Tight, sans-serif",
                        fontSize: "11px",
                        color: "#176B87",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Stack>
            </Card>

            {/* Bar Chart by Priority */}
            <Card
              shadow="lg"
              radius="xl"
              style={{
                backgroundColor: "white",
                border: "1px solid #86B6F6",
              }}
              p="xl"
            >
              <Stack gap="md">
                <Title
                  order={3}
                  style={{
                    color: "#176B87",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 700,
                  }}
                >
                  Expenses by Priority
                </Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => {
                        const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                        return `$${numValue.toLocaleString()}`;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="#176B87" />
                  </BarChart>
                </ResponsiveContainer>
              </Stack>
            </Card>
          </SimpleGrid>

          {/* Top Expenses Horizontal Bar Chart */}
          <Card
            shadow="lg"
            radius="xl"
            style={{
              backgroundColor: "white",
              border: "1px solid #86B6F6",
            }}
            p="xl"
          >
            <Stack gap="md">
              <Title
                order={3}
                style={{
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                  fontWeight: 700,
                }}
              >
                Top Expense Categories
              </Title>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={topExpensesData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={90} />
                  <Tooltip
                    formatter={(value: any) => {
                      const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                      return `$${numValue.toLocaleString()}`;
                    }}
                  />
                  <Bar dataKey="amount" fill="#176B87" />
                </BarChart>
              </ResponsiveContainer>
            </Stack>
          </Card>

          {/* Expense Details */}
          <Card
            shadow="lg"
            radius="xl"
            style={{
              backgroundColor: "white",
              border: "1px solid #86B6F6",
            }}
            p="xl"
          >
            <Stack gap="md">
              <Title
                order={3}
                style={{
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                  fontWeight: 700,
                }}
              >
                Expense Breakdown
              </Title>
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {expensePlan.expenses.map((expense, index) => (
                  <Card
                    key={index}
                    shadow="sm"
                    radius="lg"
                    style={{
                      backgroundColor: "#EEF5FF",
                      border: `1px solid ${PRIORITY_COLORS[expense.priority]}`,
                    }}
                    p="md"
                  >
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text
                          size="md"
                          style={{
                            color: "#176B87",
                            fontFamily: "Inter Tight, sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {expense.category}
                        </Text>
                        <Badge
                          color={
                            expense.priority === "essential"
                              ? "red"
                              : expense.priority === "important"
                              ? "orange"
                              : "green"
                          }
                          variant="light"
                        >
                          {expense.priority}
                        </Badge>
                      </Group>
                      <Text
                        size="xl"
                        style={{
                          color: "#176B87",
                          fontFamily: "Inter Tight, sans-serif",
                          fontWeight: 700,
                        }}
                      >
                        ${expense.recommendedAmount.toLocaleString()}
                      </Text>
                      <Progress
                        value={expense.percentage}
                        color={
                          expense.priority === "essential"
                            ? "red"
                            : expense.priority === "important"
                            ? "orange"
                            : "green"
                        }
                        size="sm"
                        radius="xl"
                      />
                      <Text
                        size="xs"
                        style={{
                          color: "#176B87",
                          opacity: 0.7,
                          fontFamily: "Inter Tight, sans-serif",
                        }}
                      >
                        {expense.percentage.toFixed(1)}% of salary
                      </Text>
                      <Text
                        size="sm"
                        style={{
                          color: "#176B87",
                          fontFamily: "Inter Tight, sans-serif",
                        }}
                      >
                        {expense.description}
                      </Text>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>

              {/* Savings Section */}
              <Divider label="Savings & Emergency Fund" labelPosition="center" />
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Card
                  shadow="sm"
                  radius="lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #E0F7E0 0%, #90EE90 100%)",
                    border: "1px solid #32CD32",
                  }}
                  p="md"
                >
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text
                        size="md"
                        style={{
                          color: "#228B22",
                          fontFamily: "Inter Tight, sans-serif",
                          fontWeight: 700,
                        }}
                      >
                        Savings
                      </Text>
                      <Save size={20} color="#228B22" />
                    </Group>
                    <Text
                      size="xl"
                      style={{
                        color: "#228B22",
                        fontFamily: "Inter Tight, sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      ${expensePlan.savings.recommendedAmount.toLocaleString()}
                    </Text>
                    <Progress
                      value={expensePlan.savings.percentage}
                      color="green"
                      size="sm"
                      radius="xl"
                    />
                    <Text
                      size="xs"
                      style={{
                        color: "#228B22",
                        opacity: 0.7,
                        fontFamily: "Inter Tight, sans-serif",
                      }}
                    >
                      {expensePlan.savings.percentage.toFixed(1)}% of salary
                    </Text>
                    <Text
                      size="sm"
                      style={{
                        color: "#228B22",
                        fontFamily: "Inter Tight, sans-serif",
                      }}
                    >
                      {expensePlan.savings.description}
                    </Text>
                  </Stack>
                </Card>

                <Card
                  shadow="sm"
                  radius="lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #E6F3FF 0%, #B4D4FF 100%)",
                    border: "1px solid #1E90FF",
                  }}
                  p="md"
                >
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text
                        size="md"
                        style={{
                          color: "#176B87",
                          fontFamily: "Inter Tight, sans-serif",
                          fontWeight: 700,
                        }}
                      >
                        Emergency Fund
                      </Text>
                      <AlertCircle size={20} color="#176B87" />
                    </Group>
                    <Text
                      size="xl"
                      style={{
                        color: "#176B87",
                        fontFamily: "Inter Tight, sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      ${expensePlan.emergencyFund.recommendedAmount.toLocaleString()}
                    </Text>
                    <Progress
                      value={expensePlan.emergencyFund.percentage}
                      color="blue"
                      size="sm"
                      radius="xl"
                    />
                    <Text
                      size="xs"
                      style={{
                        color: "#176B87",
                        opacity: 0.7,
                        fontFamily: "Inter Tight, sans-serif",
                      }}
                    >
                      {expensePlan.emergencyFund.percentage.toFixed(1)}% of salary
                    </Text>
                    <Text
                      size="sm"
                      style={{
                        color: "#176B87",
                        fontFamily: "Inter Tight, sans-serif",
                      }}
                    >
                      {expensePlan.emergencyFund.description}
                    </Text>
                  </Stack>
                </Card>
              </SimpleGrid>
            </Stack>
          </Card>

          {/* AI Recommendations */}
          {expensePlan.recommendations.length > 0 && (
            <Card
              shadow="lg"
              radius="xl"
              style={{
                backgroundColor: "white",
                border: "1px solid #86B6F6",
              }}
              p="xl"
            >
              <Stack gap="md">
                <Group gap="xs">
                  <Lightbulb size={24} color="#176B87" />
                  <Title
                    order={3}
                    style={{
                      color: "#176B87",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    AI Recommendations
                  </Title>
                </Group>
                <Stack gap="sm">
                  {expensePlan.recommendations.map((rec, index) => (
                    <Alert
                      key={index}
                      icon={<Lightbulb size={16} />}
                      title={`Tip ${index + 1}`}
                      color="blue"
                      radius="lg"
                      styles={{
                        root: {
                          backgroundColor: "#EEF5FF",
                          border: "1px solid #86B6F6",
                        },
                      }}
                    >
                      <Text
                        size="sm"
                        style={{
                          color: "#176B87",
                          fontFamily: "Inter Tight, sans-serif",
                        }}
                      >
                        {rec}
                      </Text>
                    </Alert>
                  ))}
                </Stack>
              </Stack>
            </Card>
          )}
        </>
      )}
    </Stack>
  );
};

export default ExpenseTracker;

