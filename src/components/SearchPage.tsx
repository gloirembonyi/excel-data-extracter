import React, { useState, useEffect } from "react";
import {
  Paper,
  Stack,
  Group,
  Text,
  Title,
  Button,
  Badge,
  TextInput,
  Select,
  Grid,
  Card,
  Avatar,
  ActionIcon,
  Divider,
  Box,
  ScrollArea,
  Pagination,
  Alert,
  Loader,
  Center,
  Modal,
  Textarea,
  Switch,
  NumberInput,
  MultiSelect,
  Chip,
  Tooltip,
} from "@mantine/core";
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Database,
  Calendar,
  Hash,
  Tag,
  Cpu,
  Monitor,
} from "lucide-react";
import { notifications } from "@mantine/notifications";

interface SearchResult {
  id: string;
  item_description: string;
  serial_number: string;
  tag_number: string;
  quantity: number;
  status: string;
  source: string;
  dataset_name?: string;
  project_name?: string;
  created_at: string;
  match_score?: number;
  match_type?: string;
}

interface SearchFilters {
  query: string;
  item_type: string;
  status: string;
  source: string;
  date_from: string;
  date_to: string;
  min_quantity: number | null;
  max_quantity: number | null;
  exact_match: boolean;
  case_sensitive: boolean;
}

interface SearchPageProps {
  datasets: any[];
  projects: any[];
  onExportResults?: (results: SearchResult[]) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({
  datasets,
  projects,
  onExportResults,
}) => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");
  const [exportFileName, setExportFileName] = useState("search_results");

  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    item_type: "",
    status: "",
    source: "",
    date_from: "",
    date_to: "",
    min_quantity: null,
    max_quantity: null,
    exact_match: false,
    case_sensitive: false,
  });

  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showDatasets, setShowDatasets] = useState(false);
  const [bulkSearchMode, setBulkSearchMode] = useState(false);
  const [bulkSearchText, setBulkSearchText] = useState("");

  // Bulk search function
  const handleBulkSearch = async () => {
    if (!bulkSearchText.trim()) {
      notifications.show({
        title: "Bulk Search Required",
        message: "Please paste codifications or serial numbers to search",
        color: "orange",
      });
      return;
    }

    setIsSearching(true);
    try {
      // Split the bulk text into individual search terms
      const searchTerms = bulkSearchText
        .split("\n")
        .map((term) => term.trim())
        .filter((term) => term.length > 0);

      if (searchTerms.length === 0) {
        notifications.show({
          title: "No Valid Terms",
          message: "Please enter valid codifications or serial numbers",
          color: "orange",
        });
        return;
      }

      const response = await fetch("http://localhost:8000/bulk-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search_terms: searchTerms,
          item_type: filters.item_type,
          status: filters.status,
          source: filters.source,
          exact_match: filters.exact_match,
          case_sensitive: filters.case_sensitive,
        }),
      });

      if (!response.ok) {
        throw new Error("Bulk search failed");
      }

      const data = await response.json();
      setSearchResults(data.results || []);
      setTotalPages(1);
      setTotalResults(data.total_results || 0);
      setCurrentPage(1);

      notifications.show({
        title: "Bulk Search Complete",
        message: `Found ${data.total_results || 0} results for ${searchTerms.length} search terms`,
        color: "green",
      });
    } catch (error) {
      console.error("Bulk search error:", error);
      notifications.show({
        title: "Bulk Search Failed",
        message: "Unable to perform bulk search. Please try again.",
        color: "red",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Search function
  const handleSearch = async (page: number = 1) => {
    if (bulkSearchMode) {
      handleBulkSearch();
      return;
    }

    if (
      !filters.query.trim() &&
      !filters.item_type &&
      !filters.status &&
      !filters.source
    ) {
      notifications.show({
        title: "Search Required",
        message: "Please enter a search term or select filters",
        color: "orange",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch("http://localhost:8000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...filters,
          page,
          limit: 20,
        }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setSearchResults(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotalResults(data.total_results || 0);
      setCurrentPage(page);

      // Add to search history
      if (
        filters.query.trim() &&
        !searchHistory.includes(filters.query.trim())
      ) {
        setSearchHistory((prev) => [filters.query.trim(), ...prev.slice(0, 9)]);
      }

      notifications.show({
        title: "Search Complete",
        message: `Found ${data.total_results || 0} results`,
        color: "green",
      });
    } catch (error) {
      console.error("Search error:", error);
      notifications.show({
        title: "Search Failed",
        message: "Unable to search data. Please try again.",
        color: "red",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setFilters({
      query: "",
      item_type: "",
      status: "",
      source: "",
      date_from: "",
      date_to: "",
      min_quantity: null,
      max_quantity: null,
      exact_match: false,
      case_sensitive: false,
    });
    setBulkSearchText("");
    setSearchResults([]);
    setTotalResults(0);
    setCurrentPage(1);
    setSelectedResults([]);
  };

  // Export results
  const handleExportResults = async () => {
    if (searchResults.length === 0) {
      notifications.show({
        title: "No Results",
        message: "No results to export",
        color: "orange",
      });
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8000/export-search-results",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            results: searchResults,
            format: exportFormat,
            filename: exportFileName,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportFileName}.${exportFormat === "excel" ? "xlsx" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notifications.show({
        title: "Export Complete",
        message: `Results exported as ${exportFileName}.${exportFormat === "excel" ? "xlsx" : "csv"}`,
        color: "green",
      });
      setShowExportModal(false);
    } catch (error) {
      console.error("Export error:", error);
      notifications.show({
        title: "Export Failed",
        message: "Unable to export results. Please try again.",
        color: "red",
      });
    }
  };

  // Get item type icon
  const getItemTypeIcon = (itemDescription: string) => {
    const desc = itemDescription.toLowerCase();
    if (desc.includes("cpu") || desc.includes("computer")) {
      return <Cpu size={16} />;
    } else if (
      desc.includes("screen") ||
      desc.includes("monitor") ||
      desc.includes("display")
    ) {
      return <Monitor size={16} />;
    }
    return <Database size={16} />;
  };

  // Get source color
  const getSourceColor = (source: string) => {
    switch (source) {
      case "master_data":
        return "blue";
      case "dataset":
        return "green";
      case "extracted":
        return "orange";
      default:
        return "gray";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return "green";
      case "active":
        return "blue";
      case "inactive":
        return "gray";
      case "maintenance":
        return "yellow";
      case "retired":
        return "red";
      default:
        return "gray";
    }
  };

  // Delete dataset
  const handleDeleteDataset = async (datasetId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/datasets/${datasetId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete dataset");
      }

      notifications.show({
        title: "Dataset Deleted",
        message: "Dataset has been successfully deleted",
        color: "green",
      });

      // Refresh datasets by reloading the page or calling a refresh function
      window.location.reload();
    } catch (error) {
      console.error("Delete error:", error);
      notifications.show({
        title: "Delete Failed",
        message: "Unable to delete dataset. Please try again.",
        color: "red",
      });
    }
  };

  return (
    <Stack gap="lg">
      {/* Search Header */}
      <Paper
        shadow="sm"
        p="lg"
        style={{
          background: "linear-gradient(135deg, #B4D4FF 0%, #86B6F6 100%)",
          border: "1px solid #86B6F6",
        }}
      >
        <Stack gap="md">
          <Group justify="space-between">
            <Title
              order={2}
              style={{
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 700,
              }}
            >
              🔍 Search Datasets
            </Title>
            <Group gap="sm">
              <Button
                onClick={() => setBulkSearchMode(!bulkSearchMode)}
                variant={bulkSearchMode ? "filled" : "outline"}
                leftSection={<FileSpreadsheet size={16} />}
                style={{
                  borderColor: "#176B87",
                  color: bulkSearchMode ? "white" : "#176B87",
                  backgroundColor: bulkSearchMode ? "#176B87" : "transparent",
                }}
              >
                {bulkSearchMode ? "Single Search" : "Bulk Search"}
              </Button>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters ? "filled" : "outline"}
                leftSection={<Filter size={16} />}
                style={{
                  borderColor: "#176B87",
                  color: showFilters ? "white" : "#176B87",
                  backgroundColor: showFilters ? "#176B87" : "transparent",
                }}
              >
                Filters
              </Button>
              <Button
                onClick={() => setShowDatasets(!showDatasets)}
                variant={showDatasets ? "filled" : "outline"}
                leftSection={<Database size={16} />}
                style={{
                  borderColor: "#176B87",
                  color: showDatasets ? "white" : "#176B87",
                  backgroundColor: showDatasets ? "#176B87" : "transparent",
                }}
              >
                Datasets
              </Button>
              <Button
                onClick={handleClearSearch}
                variant="outline"
                leftSection={<X size={16} />}
                style={{
                  borderColor: "#176B87",
                  color: "#176B87",
                }}
              >
                Clear
              </Button>
            </Group>
          </Group>

          {/* Search Input */}
          {bulkSearchMode ? (
            <Stack gap="md">
              <Textarea
                placeholder="Paste codifications or serial numbers here (one per line):&#10;MOH/DIG/25/SCR001&#10;MOH/DIG/25/SCR002&#10;1H35090D70&#10;1HF5110W3X"
                value={bulkSearchText}
                onChange={(e) => setBulkSearchText(e.target.value)}
                minRows={6}
                maxRows={12}
                styles={{
                  input: {
                    borderColor: "#86B6F6",
                    fontFamily: "Inter Tight, sans-serif",
                    fontSize: "14px",
                    "&:focus": {
                      borderColor: "#176B87",
                    },
                  },
                }}
              />
              <Group gap="md" justify="space-between">
                <Text
                  size="sm"
                  style={{
                    color: "#176B87",
                    fontFamily: "Inter Tight, sans-serif",
                    opacity: 0.8,
                  }}
                >
                  💡 Tip: Copy a column from Excel and paste here. Each line
                  will be searched separately.
                </Text>
                <Button
                  onClick={handleBulkSearch}
                  loading={isSearching}
                  style={{
                    backgroundColor: "#176B87",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Bulk Search
                </Button>
              </Group>
            </Stack>
          ) : (
            <Group gap="md" align="flex-end">
              <TextInput
                placeholder="Search by serial number, tag number, description..."
                value={filters.query}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, query: e.target.value }))
                }
                leftSection={<Search size={16} />}
                rightSection={
                  <ActionIcon
                    onClick={() => handleSearch(1)}
                    loading={isSearching}
                    style={{ color: "#176B87" }}
                  >
                    <Search size={16} />
                  </ActionIcon>
                }
                onKeyPress={(e) => e.key === "Enter" && handleSearch(1)}
                style={{ flex: 1 }}
                styles={{
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
                onClick={() => handleSearch(1)}
                loading={isSearching}
                style={{
                  backgroundColor: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                  fontWeight: 600,
                }}
              >
                Search
              </Button>
            </Group>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && (
            <Box>
              <Text
                size="sm"
                style={{
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                Recent Searches:
              </Text>
              <Group gap="xs">
                {searchHistory.map((term, index) => (
                  <Chip
                    key={index}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, query: term }));
                      handleSearch(1);
                    }}
                    style={{
                      fontFamily: "Inter Tight, sans-serif",
                      fontSize: "12px",
                    }}
                  >
                    {term}
                  </Chip>
                ))}
              </Group>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Advanced Filters */}
      {showFilters && (
        <Paper shadow="sm" p="lg" style={{ border: "1px solid #86B6F6" }}>
          <Stack gap="md">
            <Group justify="space-between">
              <Title
                order={3}
                style={{
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                  fontWeight: 600,
                }}
              >
                Advanced Filters
              </Title>
              <ActionIcon
                onClick={() => setShowFilters(false)}
                style={{ color: "#176B87" }}
              >
                <ChevronUp size={16} />
              </ActionIcon>
            </Group>

            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Item Type"
                  placeholder="All types"
                  value={filters.item_type}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, item_type: value || "" }))
                  }
                  data={[
                    { value: "", label: "All Types" },
                    { value: "cpu", label: "CPU" },
                    { value: "screen", label: "Screen/Monitor" },
                    { value: "other", label: "Other" },
                  ]}
                  styles={{
                    label: {
                      color: "#176B87",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                    },
                  }}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Status"
                  placeholder="All statuses"
                  value={filters.status}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value || "" }))
                  }
                  data={[
                    { value: "", label: "All Statuses" },
                    { value: "new", label: "New" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "maintenance", label: "Maintenance" },
                    { value: "retired", label: "Retired" },
                  ]}
                  styles={{
                    label: {
                      color: "#176B87",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                    },
                  }}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Source"
                  placeholder="All sources"
                  value={filters.source}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, source: value || "" }))
                  }
                  data={[
                    { value: "", label: "All Sources" },
                    { value: "master_data", label: "Master Data" },
                    { value: "dataset", label: "Dataset" },
                    { value: "extracted", label: "Extracted" },
                  ]}
                  styles={{
                    label: {
                      color: "#176B87",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                    },
                  }}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Group gap="md">
                  <NumberInput
                    label="Min Quantity"
                    placeholder="Any"
                    value={filters.min_quantity ?? undefined}
                    onChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        min_quantity: typeof value === "string" ? null : value,
                      }))
                    }
                    min={0}
                    style={{ flex: 1 }}
                    styles={{
                      label: {
                        color: "#176B87",
                        fontFamily: "Inter Tight, sans-serif",
                        fontWeight: 600,
                      },
                    }}
                  />
                  <NumberInput
                    label="Max Quantity"
                    placeholder="Any"
                    value={filters.max_quantity ?? undefined}
                    onChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        max_quantity: typeof value === "string" ? null : value,
                      }))
                    }
                    min={0}
                    style={{ flex: 1 }}
                    styles={{
                      label: {
                        color: "#176B87",
                        fontFamily: "Inter Tight, sans-serif",
                        fontWeight: 600,
                      },
                    }}
                  />
                </Group>
              </Grid.Col>
            </Grid>

            <Group gap="lg">
              <Switch
                label="Exact Match"
                checked={filters.exact_match}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    exact_match: event.currentTarget.checked,
                  }))
                }
                styles={{
                  label: {
                    color: "#176B87",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 600,
                  },
                }}
              />
              <Switch
                label="Case Sensitive"
                checked={filters.case_sensitive}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    case_sensitive: event.currentTarget.checked,
                  }))
                }
                styles={{
                  label: {
                    color: "#176B87",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 600,
                  },
                }}
              />
            </Group>
          </Stack>
        </Paper>
      )}

      {/* Datasets Management */}
      {showDatasets && (
        <Paper shadow="sm" p="lg" style={{ border: "1px solid #86B6F6" }}>
          <Stack gap="md">
            <Group justify="space-between">
              <Title
                order={3}
                style={{
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                  fontWeight: 600,
                }}
              >
                Available Datasets
              </Title>
              <ActionIcon
                onClick={() => setShowDatasets(false)}
                style={{ color: "#176B87" }}
              >
                <ChevronUp size={16} />
              </ActionIcon>
            </Group>

            {datasets.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <Avatar
                    size="xl"
                    style={{
                      backgroundColor: "#B4D4FF",
                      color: "#176B87",
                    }}
                  >
                    <Database size={32} />
                  </Avatar>
                  <Stack align="center" gap="xs">
                    <Title
                      order={4}
                      style={{
                        color: "#176B87",
                        fontFamily: "Inter Tight, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      No Datasets Available
                    </Title>
                    <Text
                      size="sm"
                      style={{
                        color: "#176B87",
                        opacity: 0.7,
                        fontFamily: "Inter Tight, sans-serif",
                        textAlign: "center",
                      }}
                    >
                      Upload Excel files to create datasets for searching
                    </Text>
                  </Stack>
                </Stack>
              </Center>
            ) : (
              <Grid>
                {datasets.map((dataset) => (
                  <Grid.Col span={6} key={dataset.id}>
                    <Card
                      shadow="sm"
                      p="md"
                      style={{
                        border: "1px solid #B4D4FF",
                        transition: "all 0.2s ease",
                      }}
                      className="hover:shadow-md"
                    >
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Group gap="sm">
                            <Avatar
                              size="md"
                              style={{
                                backgroundColor: "#B4D4FF",
                                color: "#176B87",
                              }}
                            >
                              <FileSpreadsheet size={16} />
                            </Avatar>
                            <Stack gap="xs">
                              <Text
                                size="lg"
                                style={{
                                  color: "#176B87",
                                  fontFamily: "Inter Tight, sans-serif",
                                  fontWeight: 600,
                                }}
                              >
                                {dataset.name}
                              </Text>
                              <Text
                                size="xs"
                                style={{
                                  color: "#176B87",
                                  opacity: 0.7,
                                  fontFamily: "Inter Tight, sans-serif",
                                }}
                              >
                                {dataset.description || "No description"}
                              </Text>
                            </Stack>
                          </Group>
                          <ActionIcon
                            onClick={() => handleDeleteDataset(dataset.id)}
                            style={{
                              color: "#e74c3c",
                              backgroundColor: "rgba(231, 76, 60, 0.1)",
                            }}
                            radius="md"
                          >
                            <X size={16} />
                          </ActionIcon>
                        </Group>

                        <Group justify="space-between">
                          <Group gap="xs">
                            <Badge color="blue" variant="light" size="sm">
                              {dataset.fileCount} files
                            </Badge>
                            <Badge color="green" variant="light" size="sm">
                              {dataset.totalRows} rows
                            </Badge>
                          </Group>
                          <Text
                            size="xs"
                            style={{
                              color: "#176B87",
                              opacity: 0.6,
                              fontFamily: "Inter Tight, sans-serif",
                            }}
                          >
                            {new Date(dataset.created_at).toLocaleDateString()}
                          </Text>
                        </Group>
                      </Stack>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </Stack>
        </Paper>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Paper shadow="sm" p="lg" style={{ border: "1px solid #86B6F6" }}>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="md">
                <Title
                  order={3}
                  style={{
                    color: "#176B87",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Search Results
                </Title>
                <Badge
                  color="blue"
                  variant="light"
                  style={{
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {totalResults} found
                </Badge>
              </Group>
              <Group gap="sm">
                <Button
                  onClick={() => {
                    const allData = searchResults
                      .map(
                        (r) =>
                          `${r.item_description}\t${r.serial_number}\t${r.tag_number}\t${r.quantity}\t${r.status}\t${r.source}`
                      )
                      .join("\n");
                    const headers =
                      "Item Type\tSerial Number\tCodification\tQuantity\tStatus\tSource";
                    const fullData = headers + "\n" + allData;
                    navigator.clipboard.writeText(fullData);
                    notifications.show({
                      title: "Table Copied",
                      message: "Complete table copied to clipboard",
                      color: "green",
                    });
                  }}
                  leftSection={<FileSpreadsheet size={16} />}
                  style={{
                    backgroundColor: "#28a745",
                    color: "white",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Copy Table
                </Button>
                <Button
                  onClick={() => {
                    const serialNumbers = searchResults
                      .map((r) => r.serial_number)
                      .join("\n");
                    navigator.clipboard.writeText(serialNumbers);
                    notifications.show({
                      title: "Serial Numbers Copied",
                      message: "Serial numbers column copied to clipboard",
                      color: "green",
                    });
                  }}
                  leftSection={<Hash size={16} />}
                  style={{
                    backgroundColor: "#17a2b8",
                    color: "white",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Copy Serial Numbers
                </Button>
                <Button
                  onClick={() => {
                    const codifications = searchResults
                      .map((r) => r.tag_number)
                      .join("\n");
                    navigator.clipboard.writeText(codifications);
                    notifications.show({
                      title: "Codifications Copied",
                      message: "Codifications column copied to clipboard",
                      color: "green",
                    });
                  }}
                  leftSection={<Tag size={16} />}
                  style={{
                    backgroundColor: "#6f42c1",
                    color: "white",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Copy Codifications
                </Button>
                <Button
                  onClick={() => setShowExportModal(true)}
                  leftSection={<Download size={16} />}
                  style={{
                    backgroundColor: "#86B6F6",
                    color: "#176B87",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Export
                </Button>
                <Button
                  onClick={() => handleSearch(currentPage)}
                  leftSection={<RefreshCw size={16} />}
                  variant="outline"
                  style={{
                    borderColor: "#176B87",
                    color: "#176B87",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Refresh
                </Button>
              </Group>
            </Group>

            <ScrollArea.Autosize maxHeight={600}>
              <Paper
                shadow="sm"
                style={{
                  border: "1px solid #86B6F6",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: "Inter Tight, sans-serif",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#176B87",
                        color: "white",
                      }}
                    >
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: "14px",
                          borderRight: "1px solid #86B6F6",
                          minWidth: "120px",
                        }}
                      >
                        Item Type
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: "14px",
                          borderRight: "1px solid #86B6F6",
                          minWidth: "150px",
                        }}
                      >
                        Serial Number
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: "14px",
                          borderRight: "1px solid #86B6F6",
                          minWidth: "200px",
                        }}
                      >
                        Codification
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: "14px",
                          borderRight: "1px solid #86B6F6",
                          minWidth: "100px",
                        }}
                      >
                        Quantity
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: "14px",
                          borderRight: "1px solid #86B6F6",
                          minWidth: "100px",
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: "14px",
                          minWidth: "120px",
                        }}
                      >
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((result, index) => (
                      <tr
                        key={result.id}
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                          borderBottom: "1px solid #e9ecef",
                          cursor: "pointer",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#e3f2fd";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            index % 2 === 0 ? "#ffffff" : "#f8f9fa";
                        }}
                        onClick={() => {
                          // Copy row data to clipboard
                          const rowData = `${result.item_description}\t${result.serial_number}\t${result.tag_number}\t${result.quantity}\t${result.status}\t${result.source}`;
                          navigator.clipboard.writeText(rowData);
                          notifications.show({
                            title: "Row Copied",
                            message: "Row data copied to clipboard",
                            color: "green",
                          });
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            borderRight: "1px solid #e9ecef",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#176B87",
                          }}
                        >
                          <Group gap="xs">
                            {getItemTypeIcon(result.item_description)}
                            {result.item_description}
                          </Group>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            borderRight: "1px solid #e9ecef",
                            fontSize: "14px",
                            color: "#495057",
                            fontFamily: "monospace",
                          }}
                        >
                          {result.serial_number}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            borderRight: "1px solid #e9ecef",
                            fontSize: "14px",
                            color: "#495057",
                            fontFamily: "monospace",
                          }}
                        >
                          {result.tag_number}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            borderRight: "1px solid #e9ecef",
                            fontSize: "14px",
                            color: "#495057",
                            textAlign: "center",
                          }}
                        >
                          {result.quantity}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            borderRight: "1px solid #e9ecef",
                            fontSize: "14px",
                          }}
                        >
                          <Badge
                            color={getStatusColor(result.status)}
                            variant="light"
                            size="sm"
                          >
                            {result.status}
                          </Badge>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "14px",
                          }}
                        >
                          <Badge
                            color={getSourceColor(result.source)}
                            variant="light"
                            size="sm"
                          >
                            {result.source.replace("_", " ").toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Paper>
            </ScrollArea.Autosize>

            {/* Pagination */}
            {totalPages > 1 && (
              <Center>
                <Pagination
                  value={currentPage}
                  onChange={handleSearch}
                  total={totalPages}
                  size="sm"
                  styles={{
                    control: {
                      borderColor: "#86B6F6",
                      color: "#176B87",
                      "&[data-active]": {
                        backgroundColor: "#176B87",
                      },
                    },
                  }}
                />
              </Center>
            )}
          </Stack>
        </Paper>
      )}

      {/* No Results */}
      {searchResults.length === 0 && !isSearching && totalResults === 0 && (
        <Center py="xl">
          <Stack align="center" gap="md">
            <Avatar
              size="xl"
              style={{
                backgroundColor: "#B4D4FF",
                color: "#176B87",
              }}
            >
              <Search size={32} />
            </Avatar>
            <Stack align="center" gap="xs">
              <Title
                order={3}
                style={{
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                  fontWeight: 600,
                }}
              >
                No Results Found
              </Title>
              <Text
                size="sm"
                style={{
                  color: "#176B87",
                  opacity: 0.7,
                  fontFamily: "Inter Tight, sans-serif",
                  textAlign: "center",
                }}
              >
                Try adjusting your search terms or filters
              </Text>
            </Stack>
          </Stack>
        </Center>
      )}

      {/* Loading State */}
      {isSearching && (
        <Center py="xl">
          <Stack align="center" gap="md">
            <Loader size="lg" color="#176B87" />
            <Text
              size="sm"
              style={{
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
              }}
            >
              Searching...
            </Text>
          </Stack>
        </Center>
      )}

      {/* Export Modal */}
      <Modal
        opened={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Search Results"
        size="md"
        centered
        radius="xl"
        styles={{
          header: {
            backgroundColor: "#B4D4FF",
            borderBottom: "1px solid #86B6F6",
          },
          body: {
            backgroundColor: "white",
          },
        }}
      >
        <Stack gap="lg">
          <TextInput
            label="File Name"
            placeholder="search_results"
            value={exportFileName}
            onChange={(e) => setExportFileName(e.target.value)}
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
          <Select
            label="Export Format"
            value={exportFormat}
            onChange={(value) => setExportFormat(value || "excel")}
            data={[
              { value: "excel", label: "Excel (.xlsx)" },
              { value: "csv", label: "CSV (.csv)" },
            ]}
            styles={{
              label: {
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
              },
            }}
          />
          <Text
            size="sm"
            style={{
              color: "#176B87",
              opacity: 0.7,
              fontFamily: "Inter Tight, sans-serif",
            }}
          >
            Exporting {searchResults.length} results
          </Text>
        </Stack>

        <Group justify="flex-end" mt="xl">
          <Button
            onClick={() => setShowExportModal(false)}
            variant="outline"
            radius="lg"
            style={{
              borderColor: "#86B6F6",
              color: "#176B87",
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExportResults}
            radius="lg"
            style={{
              backgroundColor: "#176B87",
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 600,
            }}
          >
            Export
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
};

export default SearchPage;
