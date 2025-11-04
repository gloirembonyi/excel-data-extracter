// Data matching and correction component

import React, { useState, useEffect } from "react";
import {
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Download,
  Database,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
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
  Select,
  Checkbox,
  ScrollArea,
  Table,
} from "@mantine/core";
import { MasterDataItem, DataMatch } from "../utils/database";

interface DataMatchingProps {
  extractedData: any[];
  projectId: string;
  onDataCorrected: (correctedData: any[]) => void;
  onExportExcel: () => void;
  selectedDataset?: any;
  datasets?: any[];
}

interface MatchResult {
  extractedItem: any;
  matches: DataMatch[];
  selectedMatch?: DataMatch;
  isCorrected: boolean;
}

const DataMatching: React.FC<DataMatchingProps> = ({
  extractedData,
  projectId,
  onDataCorrected,
  onExportExcel,
  selectedDataset,
  datasets = [],
}) => {
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [localSelectedDataset, setLocalSelectedDataset] =
    useState(selectedDataset);

  // Find matches for extracted data using SERIAL_NUMBER and Tag_Number
  const findMatches = async () => {
    if (!projectId || extractedData.length === 0) return;

    setIsLoading(true);
    try {
      // Prepare dataset data if available
      let datasetData: any[] = [];
      const currentDataset = localSelectedDataset || selectedDataset;
      if (currentDataset && currentDataset.data) {
        datasetData = currentDataset.data;
      }

      // Enhanced matching logic - prioritize SERIAL_NUMBER and Tag_Number
      const response = await fetch(
        `http://localhost:8000/projects/${projectId}/match-data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            extractedData,
            datasetData, // Include dataset data for matching
            matchStrategy: "serial_and_tag", // Use both serial and tag for matching
            confidenceThreshold: 0.7, // Higher confidence for better matches
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to find matches");

      const matches = await response.json();

      const results: MatchResult[] = extractedData.map((item, index) => {
        const itemMatches = matches[index] || [];

        // Sort matches by confidence and match type
        const sortedMatches = itemMatches.sort((a: DataMatch, b: DataMatch) => {
          // Prioritize exact matches
          if (a.match_type === "exact" && b.match_type !== "exact") return -1;
          if (b.match_type === "exact" && a.match_type !== "exact") return 1;

          // Then by confidence
          return b.confidence - a.confidence;
        });

        return {
          extractedItem: item,
          matches: sortedMatches,
          isCorrected: false,
        };
      });

      setMatchResults(results);
    } catch (error) {
      console.error("Error finding matches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    findMatches();
  }, [projectId, extractedData]);

  const handleSelectMatch = (index: number, match: DataMatch) => {
    setMatchResults((prev) =>
      prev.map((result, i) =>
        i === index
          ? { ...result, selectedMatch: match, isCorrected: true }
          : result
      )
    );
  };

  const handleRejectMatch = (index: number) => {
    setMatchResults((prev) =>
      prev.map((result, i) =>
        i === index
          ? { ...result, selectedMatch: undefined, isCorrected: false }
          : result
      )
    );
  };

  const handleApplyCorrections = () => {
    const correctedData = matchResults.map((result) => {
      if (result.selectedMatch) {
        return {
          ...result.extractedItem,
          Item_Description: result.selectedMatch.item.item_description,
          Serial_Number: result.selectedMatch.item.serial_number,
          Tag_Number: result.selectedMatch.item.tag_number,
          Quantity: result.selectedMatch.item.quantity,
          Status: result.selectedMatch.item.status,
          _corrected: true,
          _matchConfidence: result.selectedMatch.confidence,
        };
      }
      return result.extractedItem;
    });

    onDataCorrected(correctedData);
  };

  const getMatchColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600 bg-green-50";
    if (confidence >= 70) return "text-yellow-600 bg-yellow-50";
    if (confidence >= 50) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getMatchIcon = (matchType: string) => {
    switch (matchType) {
      case "exact":
        return <Check className="w-4 h-4 text-green-600" />;
      case "serial_only":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "tag_only":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "partial":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <X className="w-4 h-4 text-gray-400" />;
    }
  };

  const matchedCount = matchResults.filter((r) => r.matches.length > 0).length;
  const correctedCount = matchResults.filter((r) => r.isCorrected).length;
  const unmatchedCount = matchResults.filter(
    (r) => r.matches.length === 0
  ).length;

  return (
    <Box>
      <Group justify="space-between" align="center" mb="md">
        <Title
          order={3}
          style={{
            color: "#176B87",
            fontFamily: "Inter Tight, sans-serif",
            fontWeight: 700,
          }}
        >
          Data Matching & Correction
        </Title>
        <Group gap="sm">
          <Button
            onClick={findMatches}
            disabled={isLoading}
            leftSection={<RefreshCw size={16} />}
            style={{
              backgroundColor: "#86B6F6",
              color: "#176B87",
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 600,
            }}
            radius="lg"
            size="sm"
          >
            {isLoading ? "Refreshing..." : "Refresh Matches"}
          </Button>
          <Button
            onClick={onExportExcel}
            leftSection={<Download size={16} />}
            style={{
              backgroundColor: "#176B87",
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 600,
            }}
            radius="lg"
            size="sm"
          >
            Export Excel
          </Button>
        </Group>
      </Group>

      {/* Dataset Selection */}
      {datasets.length > 0 && (
        <Paper
          style={{
            backgroundColor: "#EEF5FF",
            border: "1px solid #86B6F6",
            borderRadius: "12px",
          }}
          p="md"
          mb="lg"
        >
          <Group justify="space-between" mb="sm">
            <Title
              order={5}
              style={{
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
              }}
            >
              Dataset for Matching
            </Title>
            <Text
              size="sm"
              style={{
                color: "#176B87",
                opacity: 0.7,
                fontFamily: "Inter Tight, sans-serif",
              }}
            >
              {localSelectedDataset
                ? `${localSelectedDataset.name} (${localSelectedDataset.totalRows} rows)`
                : "No dataset selected"}
            </Text>
          </Group>
          <Select
            placeholder="Select a dataset for matching..."
            value={localSelectedDataset?.id || ""}
            onChange={(value) => {
              const dataset = datasets.find((d) => d.id === value);
              setLocalSelectedDataset(dataset);
            }}
            data={datasets.map((dataset) => ({
              value: dataset.id,
              label: `${dataset.name} (${dataset.totalRows} rows)`,
            }))}
            style={{ marginBottom: "12px" }}
          />
          {localSelectedDataset && (
            <Box>
              <Text
                size="sm"
                style={{
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                  marginBottom: "4px",
                }}
              >
                <strong>Description:</strong>{" "}
                {localSelectedDataset.description || "No description"}
              </Text>
              <Text
                size="sm"
                style={{
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                }}
              >
                <strong>Files:</strong>{" "}
                {localSelectedDataset.files?.join(", ") || "No files"}
              </Text>
            </Box>
          )}
        </Paper>
      )}

      {/* Summary Stats */}
      <SimpleGrid cols={4} spacing="md" mb="lg">
        <Paper
          style={{
            backgroundColor: "#EEF5FF",
            border: "1px solid #86B6F6",
            borderRadius: "12px",
          }}
          p="md"
        >
          <Stack gap="xs" align="center">
            <Text
              size="xl"
              style={{
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 700,
              }}
            >
              {extractedData.length}
            </Text>
            <Text
              size="sm"
              style={{
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
              }}
            >
              Total Items
            </Text>
          </Stack>
        </Paper>
        <Paper
          style={{
            backgroundColor: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: "12px",
          }}
          p="md"
        >
          <Stack gap="xs" align="center">
            <Text
              size="xl"
              style={{
                color: "#16A34A",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 700,
              }}
            >
              {matchedCount}
            </Text>
            <Text
              size="sm"
              style={{
                color: "#16A34A",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
              }}
            >
              Matched
            </Text>
          </Stack>
        </Paper>
        <Paper
          style={{
            backgroundColor: "#FEFCE8",
            border: "1px solid #FDE047",
            borderRadius: "12px",
          }}
          p="md"
        >
          <Stack gap="xs" align="center">
            <Text
              size="xl"
              style={{
                color: "#CA8A04",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 700,
              }}
            >
              {correctedCount}
            </Text>
            <Text
              size="sm"
              style={{
                color: "#CA8A04",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
              }}
            >
              Corrected
            </Text>
          </Stack>
        </Paper>
        <Paper
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "12px",
          }}
          p="md"
        >
          <Stack gap="xs" align="center">
            <Text
              size="xl"
              style={{
                color: "#DC2626",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 700,
              }}
            >
              {unmatchedCount}
            </Text>
            <Text
              size="sm"
              style={{
                color: "#DC2626",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
              }}
            >
              Unmatched
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>

      {/* Filter Toggle */}
      <Group gap="md" mb="md">
        <Checkbox
          checked={showUnmatched}
          onChange={(event) => setShowUnmatched(event.currentTarget.checked)}
          label="Show only unmatched items"
          style={{
            fontFamily: "Inter Tight, sans-serif",
          }}
        />
      </Group>

      {/* Match Results */}
      <ScrollArea h={300} mb="md">
        <Stack gap="md">
          {matchResults
            .filter((result) => !showUnmatched || result.matches.length === 0)
            .map((result, index) => (
              <Paper
                key={index}
                style={{
                  border: "1px solid #86B6F6",
                  borderRadius: "12px",
                  backgroundColor: "white",
                }}
                p="md"
              >
                <Group justify="space-between" mb="sm">
                  <Group gap="sm">
                    <Text
                      size="sm"
                      style={{
                        color: "#176B87",
                        fontFamily: "Inter Tight, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      Item {index + 1}
                    </Text>
                    {result.isCorrected && (
                      <Badge color="green" variant="light" size="sm">
                        Corrected
                      </Badge>
                    )}
                    {result.matches.length === 0 && (
                      <Badge color="red" variant="light" size="sm">
                        No Matches
                      </Badge>
                    )}
                  </Group>
                  <Text
                    size="sm"
                    style={{
                      color: "#176B87",
                      opacity: 0.7,
                      fontFamily: "Inter Tight, sans-serif",
                    }}
                  >
                    {result.extractedItem.Item_Description} |{" "}
                    {result.extractedItem.Serial_Number}
                  </Text>
                </Group>

                {/* Extracted Data */}
                <Paper
                  style={{
                    backgroundColor: "#F8F9FA",
                    border: "1px solid #E9ECEF",
                    borderRadius: "8px",
                  }}
                  p="sm"
                  mb="sm"
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
                    Extracted Data:
                  </Text>
                  <SimpleGrid cols={2} spacing="xs">
                    <Text
                      size="sm"
                      style={{ fontFamily: "Inter Tight, sans-serif" }}
                    >
                      <strong>Item:</strong>{" "}
                      {result.extractedItem.Item_Description}
                    </Text>
                    <Text
                      size="sm"
                      style={{ fontFamily: "Inter Tight, sans-serif" }}
                    >
                      <strong>Serial:</strong>{" "}
                      {result.extractedItem.Serial_Number}
                    </Text>
                    <Text
                      size="sm"
                      style={{ fontFamily: "Inter Tight, sans-serif" }}
                    >
                      <strong>Tag:</strong> {result.extractedItem.Tag_Number}
                    </Text>
                    <Text
                      size="sm"
                      style={{ fontFamily: "Inter Tight, sans-serif" }}
                    >
                      <strong>Quantity:</strong> {result.extractedItem.Quantity}
                    </Text>
                  </SimpleGrid>
                </Paper>

                {/* Matches */}
                {result.matches.length > 0 ? (
                  <Stack gap="sm">
                    <Text
                      size="sm"
                      style={{
                        color: "#176B87",
                        fontFamily: "Inter Tight, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      Master Data Matches:
                    </Text>
                    {result.matches.slice(0, 3).map((match, matchIndex) => (
                      <Paper
                        key={matchIndex}
                        style={{
                          border:
                            result.selectedMatch?.item.id === match.item.id
                              ? "2px solid #176B87"
                              : "1px solid #86B6F6",
                          backgroundColor:
                            result.selectedMatch?.item.id === match.item.id
                              ? "#EEF5FF"
                              : "white",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
                        p="sm"
                        onClick={() => handleSelectMatch(index, match)}
                      >
                        <Group justify="space-between" mb="sm">
                          <Group gap="sm">
                            {getMatchIcon(match.match_type)}
                            <Badge
                              color={
                                match.confidence >= 90
                                  ? "green"
                                  : match.confidence >= 70
                                    ? "yellow"
                                    : match.confidence >= 50
                                      ? "orange"
                                      : "red"
                              }
                              variant="light"
                              size="sm"
                            >
                              {match.confidence}% {match.match_type}
                            </Badge>
                          </Group>
                          {result.selectedMatch?.item.id === match.item.id && (
                            <CheckCircle
                              size={16}
                              style={{ color: "#176B87" }}
                            />
                          )}
                        </Group>
                        <SimpleGrid cols={2} spacing="xs">
                          <Text
                            size="sm"
                            style={{ fontFamily: "Inter Tight, sans-serif" }}
                          >
                            <strong>Item:</strong> {match.item.item_description}
                          </Text>
                          <Text
                            size="sm"
                            style={{ fontFamily: "Inter Tight, sans-serif" }}
                          >
                            <strong>Serial:</strong> {match.item.serial_number}
                          </Text>
                          <Text
                            size="sm"
                            style={{ fontFamily: "Inter Tight, sans-serif" }}
                          >
                            <strong>Tag:</strong> {match.item.tag_number}
                          </Text>
                          <Text
                            size="sm"
                            style={{ fontFamily: "Inter Tight, sans-serif" }}
                          >
                            <strong>Quantity:</strong> {match.item.quantity}
                          </Text>
                        </SimpleGrid>
                      </Paper>
                    ))}
                    {result.matches.length > 3 && (
                      <Text
                        size="sm"
                        style={{
                          color: "#176B87",
                          opacity: 0.7,
                          fontFamily: "Inter Tight, sans-serif",
                          textAlign: "center",
                        }}
                      >
                        +{result.matches.length - 3} more matches
                      </Text>
                    )}
                  </Stack>
                ) : (
                  <Center py="md">
                    <Stack gap="sm" align="center">
                      <AlertTriangle size={32} style={{ color: "#86B6F6" }} />
                      <Text
                        size="sm"
                        style={{
                          color: "#176B87",
                          fontFamily: "Inter Tight, sans-serif",
                          textAlign: "center",
                        }}
                      >
                        No matches found in master data
                      </Text>
                      <Text
                        size="xs"
                        style={{
                          color: "#176B87",
                          opacity: 0.7,
                          fontFamily: "Inter Tight, sans-serif",
                          textAlign: "center",
                        }}
                      >
                        This item will be added as new data
                      </Text>
                    </Stack>
                  </Center>
                )}
              </Paper>
            ))}
        </Stack>
      </ScrollArea>

      {/* Action Buttons */}
      <Group
        justify="flex-end"
        gap="sm"
        mt="lg"
        pt="md"
        style={{ borderTop: "1px solid #86B6F6" }}
      >
        <Button
          onClick={() =>
            setMatchResults((prev) =>
              prev.map((r) => ({
                ...r,
                selectedMatch: undefined,
                isCorrected: false,
              }))
            )
          }
          variant="outline"
          style={{
            color: "#176B87",
            borderColor: "#86B6F6",
            fontFamily: "Inter Tight, sans-serif",
            fontWeight: 600,
          }}
          radius="lg"
        >
          Clear All
        </Button>
        <Button
          onClick={handleApplyCorrections}
          disabled={correctedCount === 0}
          style={{
            backgroundColor: "#176B87",
            fontFamily: "Inter Tight, sans-serif",
            fontWeight: 600,
          }}
          radius="lg"
        >
          Apply Corrections ({correctedCount})
        </Button>
      </Group>
    </Box>
  );
};

export default DataMatching;
