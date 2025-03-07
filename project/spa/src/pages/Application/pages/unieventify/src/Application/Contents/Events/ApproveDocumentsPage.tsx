import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  CircularProgress,
  Grid,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAppSelector, useAppDispatch } from "../../../../../../../../hooks";
import { fetchDocuments } from "../../slice";

// Interface to define the structure of the document
interface Document {
  approveDocuments: string; // URL to the document
  timestamp: string; // Timestamp for grouping by year
}

const ApproveDocumentsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { documentsByYear, loading } = useAppSelector(state => ({
    documentsByYear: state.unieventify.documentsByYear,
    loading: state.unieventify.loading
  }));
  
  const [expandedYears, setExpandedYears] = useState<{ [year: number]: boolean }>({});
  const [groupedDocuments, setGroupedDocuments] = useState<{ [year: number]: Document[] }>({});

  useEffect(() => {
    // Dispatch the action to fetch documents
    dispatch(fetchDocuments());
  }, [dispatch]);

  useEffect(() => {
    // Group documents by year when documentsByYear changes
    if (documentsByYear && documentsByYear.length > 0) {
      const groupedByYear = documentsByYear.reduce(
        (acc: { [year: number]: Document[] }, doc: Document) => {
          const year = new Date(doc.timestamp).getFullYear();
          if (!acc[year]) {
            acc[year] = [];
          }
          acc[year].push(doc);
          return acc;
        },
        {} as { [year: number]: Document[] }
      );

      setGroupedDocuments(groupedByYear);
    }
  }, [documentsByYear]);

  const currentYear = new Date().getFullYear();

  // Helper function to extract document name
  const getDocumentName = (url: string): string => {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    const nameParts = filename.split("_");
    return nameParts.slice(0, -1).join("_");
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Toggle accordion expand/collapse
  const handleAccordionChange = (year: number) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedYears((prevState) => ({
      ...prevState,
      [year]: isExpanded,
    }));
  };

  return (
    <Container maxWidth="md" sx={{ marginTop: 4, marginBottom: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Approved Documents
      </Typography>

      {Object.keys(groupedDocuments)
        .sort((a, b) => parseInt(b) - parseInt(a))
        .map((year) => {
          const yearNumber = parseInt(year); // Convert string to number
          return (
            <Accordion
              key={year}
              sx={{ marginBottom: 2 }}
              expanded={expandedYears[yearNumber] ?? yearNumber === currentYear}
              onChange={handleAccordionChange(yearNumber)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{year}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {groupedDocuments[yearNumber].map((doc, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card
                        elevation={3}
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            gutterBottom
                          >
                            {getDocumentName(doc.approveDocuments)}
                          </Typography>
                          <Link
                            href={doc.approveDocuments}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="none"
                            variant="subtitle1"
                            color="primary"
                          >
                            View Document
                          </Link>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })}
    </Container>
  );
};

export default ApproveDocumentsPage;