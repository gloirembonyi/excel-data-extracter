import React, { useState } from "react";
import {
  Card,
  Title,
  Text,
  Group,
  Button,
  Stack,
  Badge,
  Avatar,
  ActionIcon,
  Paper,
  SimpleGrid,
  Center,
  Box,
  Divider,
  Progress,
  Alert,
  Menu,
  Modal,
  Select,
  Checkbox,
} from "@mantine/core";
import {
  X,
  Upload,
  Database,
  FileText,
  Download,
  CheckCircle,
  Search,
} from "lucide-react";
import { Project, MasterDataItem } from "../utils/database";
import { exportToExcel } from "../utils/excelUtils";
import FileUpload from "./FileUpload";
import MasterDataManager from "./MasterDataManager";
import DataMatching from "./DataMatching";
import ExcelLikeTable from "./ExcelLikeTable";

interface ProjectWorkflowProps {
  currentProject: Project | null;
  masterData: MasterDataItem[];
  onProjectSelect: (project: Project) => void;
  onProjectDeselect: () => void;
  onMasterDataUpdate: () => void;
  onDataCorrected: (data: any[]) => void;
  onExportExcel: () => void;
  extractedData: any[];
  onExtractedDataChange: (data: any[]) => void;
  onFilesSelect: (files: File[]) => void;
  onFilesClear: () => void;
  files: File[];
  isProcessing: boolean;
  processingProgress: number;
  onStartProcessing: () => void;
  imageResults: any[];
  selectedDataset?: any;
  datasets?: any[];
}

const ProjectWorkflow: React.FC<ProjectWorkflowProps> = ({
  currentProject,
  masterData,
  onProjectSelect,
  onProjectDeselect,
  onMasterDataUpdate,
  onDataCorrected,
  onExportExcel,
  extractedData,
  onExtractedDataChange,
  onFilesSelect,
  onFilesClear,
  files,
  isProcessing,
  processingProgress,
  onStartProcessing,
  imageResults,
  selectedDataset,
  datasets = [],
}) => {
  const [activeStep, setActiveStep] = useState<
    "upload" | "extract" | "match" | "export"
  >("upload");
  const [matchingResults, setMatchingResults] = useState<any[]>([]);
  const [showMatchingResults, setShowMatchingResults] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchField, setSearchField] = useState("Serial_Number");
  const [exactMatch, setExactMatch] = useState(false);
  const [selectedDatasets, setSelectedDatasets] = useState<any[]>([]);
  const [combinedResults, setCombinedResults] = useState<any[]>([]);

  // Find matching data in selected datasets based on selected field
  const handleFindInDataset = async () => {
    if (selectedDatasets.length === 0 || extractedData.length === 0) {
      return;
    }

    try {
      const allMatches: any[] = [];
      const combinedTableData: any[] = [];

      // Search in each selected dataset
      for (const dataset of selectedDatasets) {
        const response = await fetch(
          `http://localhost:8000/datasets/${dataset.id}`
        );
        if (!response.ok) continue;

        const datasetData = await response.json();
        const datasetItems = datasetData.data || [];

        // Find matches based on selected field
        const matches = extractedData.map((extractedItem) => {
          const searchValue = extractedItem[searchField] || "";
          const matchingItems = datasetItems.filter((datasetItem: any) => {
            const datasetValue = datasetItem[searchField] || "";

            if (exactMatch) {
              return datasetValue.toLowerCase() === searchValue.toLowerCase();
            } else {
              return (
                datasetValue
                  .toLowerCase()
                  .includes(searchValue.toLowerCase()) ||
                searchValue.toLowerCase().includes(datasetValue.toLowerCase())
              );
            }
          });

          return {
            extractedItem,
            matches: matchingItems,
            hasMatch: matchingItems.length > 0,
            searchField,
            searchValue,
            datasetName: dataset.name,
          };
        });

        allMatches.push(...matches);

        // Add matching items to combined table
        matches.forEach((match) => {
          if (match.hasMatch) {
            match.matches.forEach((item: any, index: number) => {
              combinedTableData.push({
                No: combinedTableData.length + 1,
                ITEM:
                  item.Item_Description ||
                  item.ITEM ||
                  item.item_description ||
                  "N/A",
                CODE:
                  item.Code ||
                  item.CODE ||
                  item.code ||
                  item.Tag_Number ||
                  item.tag_number ||
                  "N/A",
                "SERIAL NUMBER":
                  item.Serial_Number ||
                  item["SERIAL NUMBER"] ||
                  item.serial_number ||
                  "N/A",
                Dataset: match.datasetName,
                "Search Field": match.searchField,
                "Search Value": match.searchValue,
              });
            });
          }
        });
      }

      setMatchingResults(allMatches);
      setCombinedResults(combinedTableData);
      setShowMatchingResults(true);
      setShowSearchModal(false);
    } catch (error) {
      console.error("Error finding matches in datasets:", error);
    }
  };

  // Get available search fields from extracted data
  const getAvailableFields = () => {
    if (extractedData.length === 0) return [];
    const fields = new Set<string>();
    extractedData.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== "_index" && item[key] && String(item[key]).trim() !== "") {
          fields.add(key);
        }
      });
    });
    return Array.from(fields);
  };

  // Export combined results to Excel
  const handleExportResults = () => {
    if (combinedResults.length === 0) return;

    try {
      const fileName = `Search_Results_${new Date().toISOString().split("T")[0]}.xlsx`;
      exportToExcel(combinedResults, fileName, "Search Results");
    } catch (error) {
      console.error("Error exporting results:", error);
    }
  };

  if (!currentProject) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Avatar
            size="xl"
            style={{
              backgroundColor: "#B4D4FF",
              color: "#176B87",
            }}
          >
            📂
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
              No Project Selected
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
              Select a project to start the data extraction workflow
            </Text>
          </Stack>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      {/* Project Header */}
      <Card
        shadow="lg"
        radius="xl"
        style={{
          backgroundColor: "white",
          border: "2px solid #176B87",
        }}
        p="lg"
      >
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Avatar
              size="lg"
              style={{
                backgroundColor: "#176B87",
                borderRadius: "12px",
              }}
            >
              📁
            </Avatar>
            <Stack gap="xs">
              <Title
                order={2}
                style={{
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {currentProject.name}
              </Title>
              <Text
                size="sm"
                style={{
                  color: "#176B87",
                  opacity: 0.8,
                  fontFamily: "Inter Tight, sans-serif",
                }}
              >
                {currentProject.description}
              </Text>
              <Group gap="lg">
                <Badge color="green" variant="light" size="sm">
                  {masterData.length} master items
                </Badge>
                <Badge color="blue" variant="light" size="sm">
                  {files.length} images
                </Badge>
                <Badge color="purple" variant="light" size="sm">
                  {extractedData.length} extracted items
                </Badge>
              </Group>
            </Stack>
          </Group>
          <ActionIcon
            onClick={onProjectDeselect}
            style={{
              color: "#176B87",
              backgroundColor: "rgba(23, 107, 135, 0.1)",
            }}
            radius="lg"
            size="lg"
          >
            <X size={20} />
          </ActionIcon>
        </Group>
      </Card>

      {/* Workflow Steps */}
      <Card
        shadow="lg"
        radius="xl"
        style={{
          backgroundColor: "white",
          border: "1px solid #86B6F6",
        }}
        p="lg"
      >
        <Stack gap="lg">
          <Title
            order={3}
            style={{
              color: "#176B87",
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 700,
            }}
          >
            Data Extraction Workflow
          </Title>

          {/* Step 1: Upload Images */}
          <Paper
            style={{
              border:
                activeStep === "upload"
                  ? "2px solid #176B87"
                  : "1px solid #86B6F6",
              backgroundColor: activeStep === "upload" ? "#EEF5FF" : "white",
              borderRadius: "12px",
            }}
            p="lg"
          >
            <Group justify="space-between" mb="md">
              <Group gap="md">
                <Avatar
                  size="md"
                  style={{
                    backgroundColor:
                      activeStep === "upload" ? "#176B87" : "#B4D4FF",
                    color: "white",
                  }}
                >
                  1
                </Avatar>
                <Stack gap="xs">
                  <Title
                    order={4}
                    style={{
                      color: "#176B87",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    Upload Images
                  </Title>
                  <Text
                    size="sm"
                    style={{
                      color: "#176B87",
                      opacity: 0.7,
                      fontFamily: "Inter Tight, sans-serif",
                    }}
                  >
                    Upload images containing data to extract
                  </Text>
                </Stack>
              </Group>
              {files.length > 0 && (
                <Badge color="green" variant="light" size="sm">
                  <CheckCircle size={12} style={{ marginRight: 4 }} />
                  {files.length} files
                </Badge>
              )}
            </Group>

            <FileUpload
              onFileSelect={() => {}}
              onMultipleFilesSelect={onFilesSelect}
              onClear={onFilesClear}
              isLoading={isProcessing}
              hasFiles={files.length > 0}
            />

            {files.length > 0 && (
              <Button
                onClick={() => setActiveStep("extract")}
                style={{
                  backgroundColor: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                  fontWeight: 600,
                }}
                radius="lg"
                mt="md"
              >
                Next: Extract Data
              </Button>
            )}
          </Paper>

          {/* Step 2: Extract Data */}
          <Paper
            style={{
              border:
                activeStep === "extract"
                  ? "2px solid #176B87"
                  : "1px solid #86B6F6",
              backgroundColor: activeStep === "extract" ? "#EEF5FF" : "white",
              borderRadius: "12px",
            }}
            p="lg"
          >
            <Group justify="space-between" mb="md">
              <Group gap="md">
                <Avatar
                  size="md"
                  style={{
                    backgroundColor:
                      activeStep === "extract" ? "#176B87" : "#B4D4FF",
                    color: "white",
                  }}
                >
                  2
                </Avatar>
                <Stack gap="xs">
                  <Title
                    order={4}
                    style={{
                      color: "#176B87",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    Extract Data
                  </Title>
                  <Text
                    size="sm"
                    style={{
                      color: "#176B87",
                      opacity: 0.7,
                      fontFamily: "Inter Tight, sans-serif",
                    }}
                  >
                    Process images and extract structured data
                  </Text>
                </Stack>
              </Group>
              {extractedData.length > 0 && (
                <Badge color="green" variant="light" size="sm">
                  <CheckCircle size={12} style={{ marginRight: 4 }} />
                  {extractedData.length} items
                </Badge>
              )}
            </Group>

            {files.length > 0 && (
              <Stack gap="md">
                <Button
                  onClick={onStartProcessing}
                  disabled={isProcessing}
                  style={{
                    backgroundColor: "#86B6F6",
                    color: "#176B87",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 600,
                  }}
                  radius="lg"
                  leftSection={<FileText size={16} />}
                >
                  {isProcessing
                    ? "Processing..."
                    : `Process ${files.length} Images`}
                </Button>

                {isProcessing && (
                  <Box>
                    <Progress
                      value={processingProgress}
                      size="lg"
                      radius="xl"
                      style={{ marginBottom: "8px" }}
                    />
                    <Text
                      size="sm"
                      style={{
                        color: "#176B87",
                        fontFamily: "Inter Tight, sans-serif",
                        textAlign: "center",
                      }}
                    >
                      {Math.round(processingProgress)}% Complete
                    </Text>
                  </Box>
                )}

                {extractedData.length > 0 && (
                  <Button
                    onClick={() => setActiveStep("match")}
                    style={{
                      backgroundColor: "#176B87",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                    }}
                    radius="lg"
                  >
                    Next: Match with Master Data
                  </Button>
                )}
              </Stack>
            )}
          </Paper>

          {/* Step 3: Match with Master Data */}
          <Paper
            style={{
              border:
                activeStep === "match"
                  ? "2px solid #176B87"
                  : "1px solid #86B6F6",
              backgroundColor: activeStep === "match" ? "#EEF5FF" : "white",
              borderRadius: "12px",
            }}
            p="lg"
          >
            <Group justify="space-between" mb="md">
              <Group gap="md">
                <Avatar
                  size="md"
                  style={{
                    backgroundColor:
                      activeStep === "match" ? "#176B87" : "#B4D4FF",
                    color: "white",
                  }}
                >
                  3
                </Avatar>
                <Stack gap="xs">
                  <Title
                    order={4}
                    style={{
                      color: "#176B87",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    Match & Correct Data
                  </Title>
                  <Text
                    size="sm"
                    style={{
                      color: "#176B87",
                      opacity: 0.7,
                      fontFamily: "Inter Tight, sans-serif",
                    }}
                  >
                    Match extracted data with master dataset and correct errors
                  </Text>
                </Stack>
              </Group>
            </Group>

            {extractedData.length > 0 ? (
              <Stack gap="md">
                {/* Show extracted data table */}
                <Card
                  shadow="sm"
                  radius="lg"
                  style={{
                    backgroundColor: "white",
                    border: "1px solid #86B6F6",
                    marginBottom: "16px",
                  }}
                  p="md"
                >
                  <Group justify="space-between" align="center" mb="md">
                    <Title
                      order={5}
                      style={{
                        color: "#176B87",
                        fontFamily: "Inter Tight, sans-serif",
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      Combined Extracted Data ({extractedData.length} items)
                    </Title>
                    {selectedDataset && (
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <Button
                            style={{
                              backgroundColor: "#86B6F6",
                              color: "#176B87",
                              fontFamily: "Inter Tight, sans-serif",
                              fontWeight: 600,
                            }}
                            radius="lg"
                            size="sm"
                            leftSection={<Search size={16} />}
                          >
                            Find in Dataset
                          </Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Label
                            style={{ fontFamily: "Inter Tight, sans-serif" }}
                          >
                            Search Options
                          </Menu.Label>
                          <Menu.Item
                            onClick={() => setShowSearchModal(true)}
                            leftSection={<Search size={14} />}
                            style={{ fontFamily: "Inter Tight, sans-serif" }}
                          >
                            Advanced Search
                          </Menu.Item>
                          <Menu.Item
                            onClick={() => {
                              setSearchField("Serial_Number");
                              setExactMatch(false);
                              setSelectedDatasets(
                                selectedDataset ? [selectedDataset] : []
                              );
                              if (selectedDataset) {
                                handleFindInDataset();
                              }
                            }}
                            leftSection={<Database size={14} />}
                            style={{ fontFamily: "Inter Tight, sans-serif" }}
                          >
                            Quick Search (Serial Number)
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Group>
                  <Box style={{ margin: 0, padding: 0 }}>
                    <ExcelLikeTable
                      data={extractedData}
                      title="Combined Extracted Data"
                      onDataChange={onExtractedDataChange}
                      className="max-h-96"
                    />
                  </Box>
                </Card>

                {/* Show combined search results in Excel-like table */}
                {showMatchingResults && combinedResults.length > 0 && (
                  <Card
                    shadow="sm"
                    radius="lg"
                    style={{
                      backgroundColor: "white",
                      border: "1px solid #86B6F6",
                      marginBottom: "16px",
                    }}
                    p="md"
                  >
                    <Group justify="space-between" align="center" mb="md">
                      <Title
                        order={5}
                        style={{
                          color: "#176B87",
                          fontFamily: "Inter Tight, sans-serif",
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        Search Results - Excel Table Format (
                        {combinedResults.length} items found)
                      </Title>
                      <Group gap="sm">
                        <Button
                          onClick={handleExportResults}
                          size="sm"
                          radius="lg"
                          style={{
                            backgroundColor: "#4CAF50",
                            fontFamily: "Inter Tight, sans-serif",
                            fontWeight: 600,
                          }}
                          leftSection={<Download size={16} />}
                        >
                          Export Excel
                        </Button>
                        <Button
                          onClick={() => setShowMatchingResults(false)}
                          variant="outline"
                          size="sm"
                          radius="lg"
                          style={{
                            borderColor: "#86B6F6",
                            color: "#176B87",
                            fontFamily: "Inter Tight, sans-serif",
                          }}
                        >
                          Close
                        </Button>
                      </Group>
                    </Group>

                    <Box style={{ margin: 0, padding: 0 }}>
                      <ExcelLikeTable
                        data={combinedResults}
                        title="Combined Search Results"
                        className="max-h-96"
                      />
                    </Box>
                  </Card>
                )}

                {/* Show detailed matching results */}
                {showMatchingResults && matchingResults.length > 0 && (
                  <Card
                    shadow="sm"
                    radius="lg"
                    style={{
                      backgroundColor: "white",
                      border: "1px solid #86B6F6",
                      marginBottom: "16px",
                    }}
                    p="md"
                  >
                    <Group justify="space-between" align="center" mb="md">
                      <Title
                        order={5}
                        style={{
                          color: "#176B87",
                          fontFamily: "Inter Tight, sans-serif",
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        Detailed Matching Results (
                        {matchingResults.filter((r) => r.hasMatch).length}{" "}
                        matches found)
                      </Title>
                    </Group>

                    <Stack gap="md">
                      {matchingResults.map((result, index) => (
                        <Paper
                          key={index}
                          style={{
                            border: result.hasMatch
                              ? "2px solid #4CAF50"
                              : "1px solid #FFC107",
                            borderRadius: "8px",
                            padding: "12px",
                            backgroundColor: result.hasMatch
                              ? "#F1F8E9"
                              : "#FFF8E1",
                          }}
                        >
                          <Group justify="space-between" mb="sm">
                            <Text
                              size="sm"
                              style={{
                                color: "#176B87",
                                fontFamily: "Inter Tight, sans-serif",
                                fontWeight: 600,
                              }}
                            >
                              {result.searchField}:{" "}
                              {result.searchValue || "N/A"}
                            </Text>
                            <Badge
                              color={result.hasMatch ? "green" : "yellow"}
                              variant="light"
                              size="sm"
                            >
                              {result.hasMatch
                                ? `${result.matches.length} matches`
                                : "No matches"}
                            </Badge>
                          </Group>

                          {result.hasMatch && (
                            <Box>
                              <Text
                                size="xs"
                                style={{
                                  color: "#176B87",
                                  fontFamily: "Inter Tight, sans-serif",
                                  fontWeight: 600,
                                  marginBottom: "8px",
                                }}
                              >
                                Found in Dataset: {result.datasetName}
                              </Text>
                              <ExcelLikeTable
                                data={result.matches}
                                title={`Matches for ${result.searchField}: ${result.searchValue || "N/A"}`}
                                className="max-h-32"
                              />
                            </Box>
                          )}

                          {!result.hasMatch && (
                            <Text
                              size="xs"
                              style={{
                                color: "#FF9800",
                                fontFamily: "Inter Tight, sans-serif",
                                fontStyle: "italic",
                              }}
                            >
                              No matching {result.searchField} values found in
                              dataset
                            </Text>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  </Card>
                )}

                {/* Show individual image results */}
                {imageResults.length > 0 && (
                  <Card
                    shadow="sm"
                    radius="lg"
                    style={{
                      backgroundColor: "white",
                      border: "1px solid #86B6F6",
                      marginBottom: "16px",
                    }}
                    p="md"
                  >
                    <Title
                      order={5}
                      style={{
                        color: "#176B87",
                        fontFamily: "Inter Tight, sans-serif",
                        fontWeight: 600,
                        marginBottom: "16px",
                      }}
                    >
                      Individual Image Extraction Results
                    </Title>
                    <Stack gap="md">
                      {imageResults.map((result, index) => (
                        <Paper
                          key={result.id}
                          style={{
                            border: "1px solid #86B6F6",
                            borderRadius: "8px",
                            padding: "12px",
                            backgroundColor: "#FAFBFC",
                          }}
                        >
                          <Group justify="space-between" mb="sm">
                            <Text
                              size="sm"
                              style={{
                                color: "#176B87",
                                fontFamily: "Inter Tight, sans-serif",
                                fontWeight: 600,
                              }}
                            >
                              {result.fileName}
                            </Text>
                            <Badge
                              color={
                                result.status === "completed"
                                  ? "green"
                                  : result.status === "error"
                                    ? "red"
                                    : result.status === "processing"
                                      ? "blue"
                                      : "gray"
                              }
                              variant="light"
                              size="sm"
                            >
                              {result.status}
                            </Badge>
                          </Group>

                          {result.status === "completed" &&
                            result.tableData &&
                            result.tableData.length > 0 && (
                              <Box style={{ margin: 0, padding: 0 }}>
                                <ExcelLikeTable
                                  data={result.tableData}
                                  title={`${result.fileName} - ${result.tableData.length} items`}
                                  className="max-h-48"
                                />
                              </Box>
                            )}

                          {result.status === "error" && result.error && (
                            <Alert
                              color="red"
                              title="Processing Error"
                              style={{ fontFamily: "Inter Tight, sans-serif" }}
                            >
                              {result.error}
                            </Alert>
                          )}

                          {result.status === "processing" && (
                            <Box
                              style={{ textAlign: "center", padding: "20px" }}
                            >
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                              <Text
                                size="sm"
                                style={{
                                  color: "#176B87",
                                  fontFamily: "Inter Tight, sans-serif",
                                }}
                              >
                                Processing...
                              </Text>
                            </Box>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  </Card>
                )}

                {/* Show matching component if master data or dataset is available */}
                {masterData.length > 0 || selectedDataset ? (
                  <Card
                    shadow="sm"
                    radius="lg"
                    style={{
                      backgroundColor: "white",
                      border: "1px solid #86B6F6",
                      marginTop: "16px",
                    }}
                    p="md"
                  >
                    <DataMatching
                      extractedData={extractedData}
                      projectId={currentProject.id}
                      onDataCorrected={onDataCorrected}
                      onExportExcel={onExportExcel}
                      selectedDataset={selectedDataset}
                      datasets={datasets}
                    />
                  </Card>
                ) : (
                  <Alert
                    color="yellow"
                    title="No Master Data or Dataset"
                    style={{
                      fontFamily: "Inter Tight, sans-serif",
                      marginTop: "16px",
                    }}
                  >
                    Upload a master dataset or select a dataset to enable data
                    matching and correction.
                  </Alert>
                )}
              </Stack>
            ) : (
              <Alert
                color="blue"
                title="No Extracted Data"
                style={{
                  fontFamily: "Inter Tight, sans-serif",
                }}
              >
                Process images first to extract data, then you can match it with
                master data.
              </Alert>
            )}
          </Paper>

          {/* Step 4: Export Results */}
          <Paper
            style={{
              border:
                activeStep === "export"
                  ? "2px solid #176B87"
                  : "1px solid #86B6F6",
              backgroundColor: activeStep === "export" ? "#EEF5FF" : "white",
              borderRadius: "12px",
            }}
            p="lg"
          >
            <Group justify="space-between" mb="md">
              <Group gap="md">
                <Avatar
                  size="md"
                  style={{
                    backgroundColor:
                      activeStep === "export" ? "#176B87" : "#B4D4FF",
                    color: "white",
                  }}
                >
                  4
                </Avatar>
                <Stack gap="xs">
                  <Title
                    order={4}
                    style={{
                      color: "#176B87",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    Export Results
                  </Title>
                  <Text
                    size="sm"
                    style={{
                      color: "#176B87",
                      opacity: 0.7,
                      fontFamily: "Inter Tight, sans-serif",
                    }}
                  >
                    Export corrected data as Excel file
                  </Text>
                </Stack>
              </Group>
            </Group>

            <Button
              onClick={onExportExcel}
              disabled={extractedData.length === 0}
              style={{
                backgroundColor: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
              }}
              radius="lg"
              leftSection={<Download size={16} />}
            >
              Export to Excel
            </Button>
          </Paper>
        </Stack>
      </Card>

      {/* Master Data Management */}
      <Card
        shadow="lg"
        radius="xl"
        style={{
          backgroundColor: "white",
          border: "1px solid #86B6F6",
        }}
        p="lg"
      >
        <Title
          order={3}
          style={{
            color: "#176B87",
            fontFamily: "Inter Tight, sans-serif",
            fontWeight: 700,
            marginBottom: "16px",
          }}
        >
          Master Dataset Management
        </Title>

        <MasterDataManager
          projectId={currentProject.id}
          onDataUpdated={onMasterDataUpdate}
        />
      </Card>

      {/* Advanced Search Modal */}
      <Modal
        opened={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="Advanced Dataset Search"
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
          <Text
            size="sm"
            style={{
              color: "#176B87",
              fontFamily: "Inter Tight, sans-serif",
            }}
          >
            Search for extracted data items in selected datasets by matching
            field values.
          </Text>

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
              Select Datasets to Search
            </Text>
            <Stack gap="xs">
              {datasets.map((dataset) => (
                <Checkbox
                  key={dataset.id}
                  checked={selectedDatasets.some((d) => d.id === dataset.id)}
                  onChange={(event) => {
                    if (event.currentTarget.checked) {
                      setSelectedDatasets((prev) => [...prev, dataset]);
                    } else {
                      setSelectedDatasets((prev) =>
                        prev.filter((d) => d.id !== dataset.id)
                      );
                    }
                  }}
                  label={`${dataset.name} (${dataset.totalRows} rows)`}
                  styles={{
                    label: {
                      color: "#176B87",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 500,
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Select
            label="Search Field"
            placeholder="Select field to search by"
            value={searchField}
            onChange={(value) => setSearchField(value || "Serial_Number")}
            data={getAvailableFields().map((field) => ({
              value: field,
              label: field,
            }))}
            required
            radius="lg"
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

          <Checkbox
            checked={exactMatch}
            onChange={(event) => setExactMatch(event.currentTarget.checked)}
            label="Exact match only"
            description="Check to require exact field value matches (case-insensitive)"
            styles={{
              label: {
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
              },
              description: {
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                opacity: 0.7,
              },
            }}
          />

          <Paper
            style={{
              backgroundColor: "#F8F9FA",
              border: "1px solid #86B6F6",
              borderRadius: "8px",
            }}
            p="md"
          >
            <Text
              size="sm"
              style={{
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Search Preview:
            </Text>
            <Text
              size="xs"
              style={{
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                opacity: 0.8,
              }}
            >
              • Searching by: <strong>{searchField}</strong>
              <br />• Match type:{" "}
              <strong>{exactMatch ? "Exact" : "Partial"}</strong>
              <br />• Selected datasets:{" "}
              <strong>{selectedDatasets.length}</strong> (
              {selectedDatasets.map((d) => d.name).join(", ")})<br />• Items to
              search: <strong>{extractedData.length}</strong>
            </Text>
          </Paper>
        </Stack>

        <Group justify="flex-end" mt="xl">
          <Button
            onClick={() => setShowSearchModal(false)}
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
            onClick={handleFindInDataset}
            disabled={selectedDatasets.length === 0}
            radius="lg"
            style={{
              backgroundColor: "#176B87",
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 600,
            }}
            leftSection={<Search size={16} />}
          >
            Search Datasets ({selectedDatasets.length})
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
};

export default ProjectWorkflow;
