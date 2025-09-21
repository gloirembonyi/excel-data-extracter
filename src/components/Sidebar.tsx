import React, { useState } from 'react';
import { Project } from '../utils/database';
import { 
  Paper, 
  Stack, 
  Group, 
  Text, 
  Title, 
  Button, 
  Badge, 
  Avatar, 
  Divider,
  ThemeIcon,
  Box,
  Collapse,
  ActionIcon,
  FileInput,
  Modal,
  TextInput,
  Textarea,
  Progress,
  Alert
} from '@mantine/core';
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Database, 
  FileSpreadsheet,
  X,
  Check
} from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  description?: string;
  fileCount: number;
  totalRows: number;
  created_at: string;
  files: string[];
}

interface SidebarProps {
  activeTab: 'extract' | 'compare' | 'projects' | 'tools' | 'search';
  onTabChange: (tab: 'extract' | 'compare' | 'projects' | 'tools' | 'search') => void;
  currentProject: Project | null;
  masterDataCount: number;
  apiKeyStatuses: Array<{ status: string; isWorking: boolean }>;
  datasets?: Dataset[];
  onDatasetUpload?: (files: File[], datasetName: string, description?: string) => Promise<void>;
  onDatasetSelect?: (dataset: Dataset) => void;
  selectedDataset?: Dataset | null;
  onCollapseChange?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentProject,
  masterDataCount,
  apiKeyStatuses,
  datasets = [],
  onDatasetUpload,
  onDatasetSelect,
  selectedDataset,
  onCollapseChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDatasetUpload, setShowDatasetUpload] = useState(false);
  const [showDatasets, setShowDatasets] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const workingApiKeys = apiKeyStatuses.filter(key => key.status === 'working').length;
  const totalApiKeys = apiKeyStatuses.length;

  const handleCollapseToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const handleDatasetUpload = async () => {
    if (!onDatasetUpload || uploadFiles.length === 0 || !datasetName.trim()) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onDatasetUpload(uploadFiles, datasetName, datasetDescription);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset form
      setUploadFiles([]);
      setDatasetName('');
      setDatasetDescription('');
      setShowDatasetUpload(false);
      
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error('Dataset upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Paper 
        style={{ 
          width: isCollapsed ? '60px' : '280px',
          height: '100vh',
          backgroundColor: 'white',
          borderRight: '1px solid #86B6F6',
          borderRadius: 0,
          overflow: 'hidden',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1000,
          transition: 'width 0.3s ease'
        }}
        shadow="xl"
      >
      <Stack gap={0} style={{ height: '100%' }}>
        {/* Header */}
        <Box 
          style={{
            background: 'linear-gradient(135deg, #176B87 0%, #86B6F6 100%)',
            padding: isCollapsed ? '12px 8px' : '12px',
            borderBottom: '1px solid #86B6F6',
            position: 'relative'
          }}
        >
          <Group justify="space-between" align="center">
            {!isCollapsed && (
              <Stack gap="xs" style={{ flex: 1 }}>
                <Title 
                  order={4} 
                  style={{ 
                    color: 'white',
                    fontFamily: 'Inter Tight, sans-serif',
                    fontWeight: 700,
                    fontSize: '14px',
                    margin: 0
                  }}
                >
                  Excel Table Maker
                </Title>
                <Text 
                  size="xs" 
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontFamily: 'Inter Tight, sans-serif',
                    fontSize: '10px'
                  }}
                >
                  Data Extraction & Correction
                </Text>
              </Stack>
            )}
            <ActionIcon
              onClick={handleCollapseToggle}
              style={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: 'none'
              }}
              radius="md"
              size="sm"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </ActionIcon>
          </Group>
        </Box>
      
        {/* Navigation */}
        <Stack gap="xs" p="xs" style={{ flex: 1 }}>
          <Button
            onClick={() => onTabChange('extract')}
            variant={activeTab === 'extract' ? 'filled' : 'subtle'}
            size="sm"
            style={{
              backgroundColor: activeTab === 'extract' ? '#176B87' : 'transparent',
              color: activeTab === 'extract' ? 'white' : '#176B87',
              fontFamily: 'Inter Tight, sans-serif',
              fontWeight: 600,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              height: '36px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px'
            }}
            leftSection={!isCollapsed ? <Text size="sm">📊</Text> : undefined}
            fullWidth
          >
            {isCollapsed ? '📊' : 'Extract Data'}
          </Button>
          <Button
            onClick={() => onTabChange('compare')}
            variant={activeTab === 'compare' ? 'filled' : 'subtle'}
            size="sm"
            style={{
              backgroundColor: activeTab === 'compare' ? '#176B87' : 'transparent',
              color: activeTab === 'compare' ? 'white' : '#176B87',
              fontFamily: 'Inter Tight, sans-serif',
              fontWeight: 600,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              height: '36px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px'
            }}
            leftSection={!isCollapsed ? <Text size="sm">🔍</Text> : undefined}
            fullWidth
          >
            {isCollapsed ? '🔍' : 'Compare Data'}
          </Button>
          <Button
            onClick={() => onTabChange('projects')}
            variant={activeTab === 'projects' ? 'filled' : 'subtle'}
            size="sm"
            style={{
              backgroundColor: activeTab === 'projects' ? '#176B87' : 'transparent',
              color: activeTab === 'projects' ? 'white' : '#176B87',
              fontFamily: 'Inter Tight, sans-serif',
              fontWeight: 600,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              height: '36px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px'
            }}
            leftSection={!isCollapsed ? <Text size="sm">📁</Text> : undefined}
            fullWidth
          >
            {isCollapsed ? '📁' : 'Projects'}
          </Button>
          <Button
            onClick={() => onTabChange('tools')}
            variant={activeTab === 'tools' ? 'filled' : 'subtle'}
            size="sm"
            style={{
              backgroundColor: activeTab === 'tools' ? '#176B87' : 'transparent',
              color: activeTab === 'tools' ? 'white' : '#176B87',
              fontFamily: 'Inter Tight, sans-serif',
              fontWeight: 600,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              height: '36px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px'
            }}
            leftSection={!isCollapsed ? <Text size="sm">🛠️</Text> : undefined}
            fullWidth
          >
            {isCollapsed ? '🛠️' : 'Tools'}
          </Button>
          <Button
            onClick={() => onTabChange('search')}
            variant={activeTab === 'search' ? 'filled' : 'subtle'}
            size="sm"
            style={{
              backgroundColor: activeTab === 'search' ? '#176B87' : 'transparent',
              color: activeTab === 'search' ? 'white' : '#176B87',
              fontFamily: 'Inter Tight, sans-serif',
              fontWeight: 600,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              height: '36px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px'
            }}
            leftSection={!isCollapsed ? <Text size="sm">🔍</Text> : undefined}
            fullWidth
          >
            {isCollapsed ? '🔍' : 'Search Data'}
          </Button>
        </Stack>

        {/* Dataset Management Section */}
        {!isCollapsed && (
          <Box p="xs" style={{ borderTop: '1px solid #86B6F6' }}>
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Text 
                  size="xs" 
                  style={{ 
                    color: '#176B87',
                    fontFamily: 'Inter Tight, sans-serif',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Datasets
                </Text>
                <Group gap="xs">
                  <ActionIcon
                    onClick={() => setShowDatasetUpload(true)}
                    size="sm"
                    style={{
                      backgroundColor: '#86B6F6',
                      color: '#176B87'
                    }}
                    radius="md"
                  >
                    <Upload size={14} />
                  </ActionIcon>
                  <ActionIcon
                    onClick={() => setShowDatasets(!showDatasets)}
                    size="sm"
                    style={{
                      backgroundColor: showDatasets ? '#176B87' : '#B4D4FF',
                      color: showDatasets ? 'white' : '#176B87'
                    }}
                    radius="md"
                  >
                    <Database size={14} />
                  </ActionIcon>
                </Group>
              </Group>

              <Collapse in={showDatasets}>
                <Stack gap="xs">
                  {datasets.length === 0 ? (
                    <Text 
                      size="xs" 
                      style={{ 
                        color: '#176B87',
                        opacity: 0.7,
                        fontStyle: 'italic',
                        textAlign: 'center',
                        padding: '8px'
                      }}
                    >
                      No datasets yet
                    </Text>
                  ) : (
                    datasets.map((dataset) => (
                      <Paper
                        key={dataset.id}
                        onClick={() => onDatasetSelect?.(dataset)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: selectedDataset?.id === dataset.id 
                            ? '#B4D4FF' 
                            : '#EEF5FF',
                          border: selectedDataset?.id === dataset.id 
                            ? '1px solid #176B87' 
                            : '1px solid #86B6F6',
                          borderRadius: '8px',
                          padding: '8px',
                          transition: 'all 0.2s ease'
                        }}
                        className="hover:bg-blue-50"
                      >
                        <Stack gap="xs">
                          <Group justify="space-between" align="center">
                            <Text 
                              size="sm" 
                              style={{ 
                                color: '#176B87',
                                fontFamily: 'Inter Tight, sans-serif',
                                fontWeight: 600
                              }}
                              truncate
                            >
                              {dataset.name}
                            </Text>
                            {selectedDataset?.id === dataset.id && (
                              <Check size={12} color="#176B87" />
                            )}
                          </Group>
                          <Group justify="space-between">
                            <Text 
                              size="xs" 
                              style={{ 
                                color: '#176B87',
                                opacity: 0.7,
                                fontFamily: 'Inter Tight, sans-serif'
                              }}
                            >
                              {dataset.fileCount} files
                            </Text>
                            <Text 
                              size="xs" 
                              style={{ 
                                color: '#176B87',
                                opacity: 0.7,
                                fontFamily: 'Inter Tight, sans-serif'
                              }}
                            >
                              {dataset.totalRows} rows
                            </Text>
                          </Group>
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Collapse>
            </Stack>
          </Box>
        )}
      
        {/* Status Section */}
        <Box 
          style={{
            backgroundColor: '#B4D4FF',
            borderTop: '1px solid #86B6F6',
            padding: '8px'
          }}
        >
          <Stack gap="xs">
            {!isCollapsed && (
              <Text 
                size="xs" 
                style={{ 
                  color: '#176B87',
                  fontFamily: 'Inter Tight, sans-serif',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                System Status
              </Text>
            )}
            <Group justify={isCollapsed ? "center" : "space-between"}>
              {!isCollapsed && (
                <Text 
                  size="sm" 
                  style={{ 
                    color: '#176B87',
                    fontFamily: 'Inter Tight, sans-serif',
                    fontWeight: 600
                  }}
                >
                  API Keys:
                </Text>
              )}
              <Badge 
                color={workingApiKeys >= 3 ? 'green' : 'yellow'}
                variant="light"
                size="sm"
                style={{
                  fontFamily: 'Inter Tight, sans-serif',
                  fontWeight: 700
                }}
              >
                {workingApiKeys}/{totalApiKeys}
              </Badge>
            </Group>
            
            {currentProject && !isCollapsed && (
              <Paper 
                style={{
                  background: 'linear-gradient(135deg, #EEF5FF 0%, #B4D4FF 100%)',
                  border: '1px solid #86B6F6',
                  borderRadius: '12px'
                }}
                p="md"
              >
                <Group gap="sm" mb="sm">
                  <Avatar 
                    size="sm" 
                    style={{ 
                      backgroundColor: '#176B87',
                      borderRadius: '8px'
                    }}
                  >
                    📁
                  </Avatar>
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Text 
                      size="xs" 
                      style={{ 
                        color: '#176B87',
                        fontFamily: 'Inter Tight, sans-serif',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Current Project
                    </Text>
                    <Text 
                      size="sm" 
                      style={{ 
                        color: '#176B87',
                        fontFamily: 'Inter Tight, sans-serif',
                        fontWeight: 700
                      }}
                      truncate
                    >
                      {currentProject.name}
                    </Text>
                  </Stack>
                </Group>
                <Group justify="space-between">
                  <Group gap="xs">
                    <Badge 
                      color="green" 
                      variant="light"
                      size="xs"
                    >
                      {masterDataCount} items
                    </Badge>
                  </Group>
                  <Text 
                    size="xs" 
                    style={{ 
                      color: '#176B87',
                      opacity: 0.7,
                      fontFamily: 'Inter Tight, sans-serif'
                    }}
                  >
                    {new Date(currentProject.created_at).toLocaleDateString()}
                  </Text>
                </Group>
              </Paper>
            )}

            {currentProject && isCollapsed && (
              <Group justify="center">
                <Avatar 
                  size="md" 
                  style={{ 
                    backgroundColor: '#176B87',
                    borderRadius: '8px'
                  }}
                >
                  📁
                </Avatar>
              </Group>
            )}
            
            {!currentProject && !isCollapsed && (
              <Paper 
                style={{
                  backgroundColor: '#EEF5FF',
                  border: '1px solid #86B6F6',
                  borderRadius: '12px'
                }}
                p="md"
              >
                <Stack align="center" gap="sm">
                  <Avatar 
                    size="sm" 
                    style={{ 
                      backgroundColor: '#B4D4FF',
                      color: '#176B87',
                      borderRadius: '8px'
                    }}
                  >
                    📂
                  </Avatar>
                  <Stack align="center" gap="xs">
                    <Text 
                      size="xs" 
                      style={{ 
                        color: '#176B87',
                        fontFamily: 'Inter Tight, sans-serif',
                        fontWeight: 700
                      }}
                    >
                      No Project Selected
                    </Text>
                    <Text 
                      size="xs" 
                      style={{ 
                        color: '#176B87',
                        opacity: 0.7,
                        fontFamily: 'Inter Tight, sans-serif',
                        textAlign: 'center'
                      }}
                    >
                      Create or select a project to start
                    </Text>
                  </Stack>
                </Stack>
              </Paper>
            )}

            {!currentProject && isCollapsed && (
              <Group justify="center">
                <Avatar 
                  size="md" 
                  style={{ 
                    backgroundColor: '#B4D4FF',
                    color: '#176B87',
                    borderRadius: '8px'
                  }}
                >
                  📂
                </Avatar>
              </Group>
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>

    {/* Dataset Upload Modal */}
    <Modal
      opened={showDatasetUpload}
      onClose={() => setShowDatasetUpload(false)}
      title="Upload Dataset"
      size="md"
      centered
      radius="xl"
      styles={{
        header: {
          backgroundColor: '#B4D4FF',
          borderBottom: '1px solid #86B6F6'
        },
        body: {
          backgroundColor: 'white'
        }
      }}
    >
      <Stack gap="lg">
        <TextInput
          label="Dataset Name"
          placeholder="Enter dataset name (e.g., Health Center Inventory)"
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
          required
          radius="lg"
          styles={{
            label: {
              color: '#176B87',
              fontFamily: 'Inter Tight, sans-serif',
              fontWeight: 600
            },
            input: {
              borderColor: '#86B6F6',
              fontFamily: 'Inter Tight, sans-serif',
              '&:focus': {
                borderColor: '#176B87'
              }
            }
          }}
        />
        
        <Textarea
          label="Description"
          placeholder="Enter dataset description (optional)"
          value={datasetDescription}
          onChange={(e) => setDatasetDescription(e.target.value)}
          rows={3}
          radius="lg"
          styles={{
            label: {
              color: '#176B87',
              fontFamily: 'Inter Tight, sans-serif',
              fontWeight: 600
            },
            input: {
              borderColor: '#86B6F6',
              fontFamily: 'Inter Tight, sans-serif',
              '&:focus': {
                borderColor: '#176B87'
              }
            }
          }}
        />

        <FileInput
          label="Excel Files"
          placeholder="Select multiple Excel files"
          accept=".xlsx,.xls"
          multiple
          value={uploadFiles}
          onChange={setUploadFiles}
          required
          radius="lg"
          styles={{
            label: {
              color: '#176B87',
              fontFamily: 'Inter Tight, sans-serif',
              fontWeight: 600
            },
            input: {
              borderColor: '#86B6F6',
              fontFamily: 'Inter Tight, sans-serif',
              '&:focus': {
                borderColor: '#176B87'
              }
            }
          }}
        />

        {uploadFiles.length > 0 && (
          <Alert
            icon={<FileSpreadsheet size={16} />}
            title="Files Selected"
            color="blue"
            radius="lg"
            styles={{
              root: {
                backgroundColor: '#EEF5FF',
                border: '1px solid #86B6F6'
              }
            }}
          >
            <Stack gap="xs">
              {uploadFiles.map((file, index) => (
                <Text 
                  key={index} 
                  size="sm" 
                  style={{ 
                    color: '#176B87',
                    fontFamily: 'Inter Tight, sans-serif'
                  }}
                >
                  • {file.name}
                </Text>
              ))}
              <Text 
                size="xs" 
                style={{ 
                  color: '#176B87',
                  opacity: 0.7,
                  fontFamily: 'Inter Tight, sans-serif',
                  fontStyle: 'italic'
                }}
              >
                All files will be combined into one unified dataset
              </Text>
            </Stack>
          </Alert>
        )}

        {isUploading && (
          <Box>
            <Text 
              size="sm" 
              style={{ 
                color: '#176B87',
                fontFamily: 'Inter Tight, sans-serif',
                fontWeight: 600,
                marginBottom: '8px'
              }}
            >
              Uploading dataset...
            </Text>
            <Progress 
              value={uploadProgress} 
              color="blue" 
              radius="lg"
              size="sm"
            />
          </Box>
        )}
      </Stack>
      
      <Group justify="flex-end" mt="xl">
        <Button
          onClick={() => setShowDatasetUpload(false)}
          variant="outline"
          radius="lg"
          disabled={isUploading}
          style={{
            borderColor: '#86B6F6',
            color: '#176B87',
            fontFamily: 'Inter Tight, sans-serif',
            fontWeight: 600
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDatasetUpload}
          disabled={!datasetName.trim() || uploadFiles.length === 0 || isUploading}
          radius="lg"
          style={{
            backgroundColor: '#176B87',
            fontFamily: 'Inter Tight, sans-serif',
            fontWeight: 600
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload Dataset'}
        </Button>
      </Group>
    </Modal>
    </>
  );
};

export default Sidebar;
