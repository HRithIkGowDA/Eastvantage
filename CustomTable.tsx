/* eslint-disable react-hooks/exhaustive-deps */
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Popover from "@mui/material/Popover";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Theme } from "@mui/material/styles/createTheme";
import createStyles from "@mui/styles/createStyles";
import makeStyles from "@mui/styles/makeStyles";
import withStyles from "@mui/styles/withStyles";
import {
  ASC,
  DEFAULT_ROWS_PER_PAGE,
  DESC,
  DEVELOPER,
  NEW_DATA_TABLES,
  TITLE
} from "common/Constants";
import { getSortedRecord, useResourceVisibility } from "common/util";
import ColumnFilter from "components/ColumnFilter";
import NoResultFound from "components/NoResultFound";
import Fuse from "fuse.js";
import moment from "moment";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import { RootState } from "reducers";
import { Highlight } from "./Highlight";
import RecordAvatar from "./RecordAvatar";
import Pagination from "./TablePagination";
import { CustomTableSkeleton } from "./TableSkeleton";
import ActiveTags from "./Tags/ActiveTags";

const useStyles = makeStyles(theme => ({
  mainContainer: {
    padding: "9px 10px 0px 10px"
  },
  tableContainer: {
    backgroundColor: "#ffff",
    "& .MuiTableCell-sizeSmall": {
      padding: "1px 6px"
    },
    "&::-webkit-scrollbar": {
      height: "6px",
      width: "6px"
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "#f0f0f0"
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "darkgrey",
      borderRadius: "5px"
    }
  },
  tableHeight: {
    [theme.breakpoints.up("xl")]: {
      height: "89vh"
    },
    [theme.breakpoints.up("lg")]: {
      height: "86vh"
    },
    [theme.breakpoints.down("md")]: {
      height: "83vh"
    },
    [theme.breakpoints.between("lg", "xl")]: {
      height: "83vh"
    },
    [theme.breakpoints.between("md", "lg")]: {
      height: "82vh"
    },
    [theme.breakpoints.between("sm", "md")]: {
      height: "80vh"
    }
  },
  pagination: {
    maxHeight: "52px",
    backgroundColor: "#f0f0f0",
    padding: "1px !important",
    position: "sticky",
    bottom: 0,
    zIndex: 1
  },
  root: {
    width: "120px"
  },
  listItem: {
    paddingTop: "0px",
    paddingBottom: "0px"
  },
  mark: {
    "& mark": {
      backgroundColor: "yellow !important",
      padding: "0px !important"
    }
  },
  deleteIcon: {
    color: "#6e6e6e",
    transitionDelay: "0.3s",
    transition: "0.3s"
  },
  deleteButton: {
    opacity: 0,
    "&:hover $deleteIcon": {
      color: "#FF0000"
    }
  },
  tableRow: {
    cursor: "pointer",
    position: "relative",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.04)"
    },
    "&:hover $deleteButton": {
      opacity: 1
    }
  },
  tags: {
    position: "absolute",
    left: 0,
    bottom: 0,
    paddingBottom: `2px!important`
  },
  tagsSpace: {
    paddingBottom: `30px!important`
  },
  wrapStyle: {
    maxWidth: "fit-content",
    minWidth: "25rem"
  },
  contentWidth: {
    width: "max-content"
  },
  headerCapitalize: {
    textTransform: "capitalize"
  },
  headerNormal: {
    textTransform: "none"
  },
  filterIcon: {
    backgroundColor: "#0096d6",
    color: "white"
  }
}));
const CustomTable = (props: any) => {
  const {
    tableHeader,
    records,
    handleDelete,
    handleEditClick,
    openDeleteConfirmation,
    avatar,
    title,
    total,
    menuItem,
    thTitles,
    selectedCountry,
    loading,
    isExternalTable,
    handlePageNumChange,
    isPaProductLine,
    noRecordFoundHeader
  } = props;
  const dispatch = useDispatch();
  const isVisible = useResourceVisibility();
  const classes = useStyles();
  const [totalRecord, setTotalRecord] = useState(DEFAULT_ROWS_PER_PAGE);
  const params = useParams();
  const [filteredRecords, setFilteredRecords] = useState(records);
  const searchedQueryTerm = useSelector(
    (state: RootState) => state.dashboardReducer.searchedQueryTerm
  );
  const isDrawerOpen = useSelector(
    (state: RootState) => state.dashboardReducer.isDrawerOpen
  );
  const {
    EMPLOYEES,
    HP_QUOTE,
    PARTNERUSER,
    PARTNERCOMPANY,
    DYNAMIC_FORMS,
    IQ_CH_ROUTING,
    ESCALATED_QUOTES,
    PA_PRODUCT_LINES
  } = TITLE;
  const userTitleList: Array<string> = useMemo(
    () => [EMPLOYEES, PARTNERUSER, HP_QUOTE, PARTNERCOMPANY],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const booleanHeader =
    Object.entries(records)?.length &&
    Object.entries(records?.[0]).reduce(
      (result: any, [key, value]: any) =>
        typeof value === "boolean" ? [...result, key] : result,
      []
    );

  const [order, setOrder] = useState(DESC);
  const [orderBy, setOrderBy] = useState(
    menuItem === NEW_DATA_TABLES
      ? "updatedat"
      : title === "Employees" || "PartnerUser"
        ? ""
        : "updatedAt"
  );
  const { searchTerm, rowsPerPage, userGroups, where } = useSelector(
    (state: RootState) => state.dashboardReducer
  );
  const currentCountry = useSelector(
    (state: RootState) => state.languageReducer.currentCountry
  );
  const isEisEuv = useSelector(
    (state: any) => state.getHpQuoteReducer.isEisEuv
  );
  let countryCode = records.map((item: any) => item.countryCode);
  countryCode = countryCode.filter(function (elem: any, pos: any) {
    return countryCode.indexOf(elem) === pos;
  });
  const partnersUserHeader = ["email", "partnerLocationID"];
  const paProducline = ["pa_num", "product_line"];
  const [open, setOpen] = useState(false);
  const [selectedCountries, setSelectedCountries]: any = useState([]);
  const [page, setPage] = useState(0);
  useEffect(() => {
    setPage(props?.page || 0);
  }, [props.page]);
  useEffect(() => {
    if (total > totalRecord) {
      setTotalRecord(total);
    }
    //eslint-disable-next-line
  }, [total]);
  useEffect(() => {
    setPage(0);
    setTotalRecord(DEFAULT_ROWS_PER_PAGE);
  }, [params]);
  const StyledTableCell = withStyles((theme: Theme) =>
    createStyles({
      head: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#000",
        paddingTop: 16,
        paddingBottom: 16,
        whiteSpace: "nowrap"
      },
      body: {
        fontSize: 14,
        textTransform: "capitalize"
      }
    })
  )(TableCell);
  const hpQuoteVisibility =
    title === HP_QUOTE && !userGroups.includes(DEVELOPER);
  const handleDeleteClick = (
    event: React.BaseSyntheticEvent<MouseEvent>,
    id: string
  ) => {
    if (currentCountry && currentCountry !== "en") {
      return false;
    }
    const rowElement = event.target.closest(".MuiTableRow-root");
    rowElement.style.opacity = 0.2;
    openDeleteConfirmation(id, rowElement);
  };

  const onOrder = () => {
    order === ASC ? setOrder(DESC) : setOrder(ASC);
  };

  const setEisEUv = (type: string) => {
    handleChangePage(0);
    dispatch({
      type: "SET_EIS_EUV",
      payload: type
    });
  };

  const onCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target;

    if (checked) {
      if (title === DYNAMIC_FORMS || title === EMPLOYEES) {
        setSelectedCountries([...selectedCountries, value]);
      }
      if (title === HP_QUOTE) setEisEUv(value);
    } else {
      if (title === DYNAMIC_FORMS || title === EMPLOYEES) {
        setSelectedCountries(
          selectedCountries.filter((country: string) => country !== value)
        );
      }
      if (title === HP_QUOTE) setEisEUv("");
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    if (selectedCountries.length === 0) {
      setFilteredRecords(records);
    }
    handleFilterRecords();
    setOpen(false);
  };

  const handleChangePage = (page: number) => {
    setPage(page);
    if (typeof props.handleChangePage === "function") {
      props.handleChangePage(page);
    }
    if (isExternalTable) handlePageNumChange(page);
  };
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    dispatch({
      type: "SET_CPQ_ROWS_PER_PAGE",
      payload: event.target.value
    });
    setPage(0);
    if (isExternalTable) handlePageNumChange(0);
  };

  const getDate = (date: any) => {
    let newDate = date.split(" ");
    const momentFormat = moment(
      `${newDate[0]} ${newDate[1]}${newDate[2]}`
    ).format("lll");
    return momentFormat;
  };
  const getLogDetails = (date: any) => {
    if (date !== "") {
      return moment(date || date).format("lll") === "Invalid date"
        ? getDate(date || date)
        : moment(date || date).format("lll");
    } else {
      return "";
    }
  };

  const handleFilterRecords = useCallback(
    () => {
      /* let filterData = searchTerm?.length
        ? records &&
          records.filter((record: any) => {
            let values: string[] =
              tableHeader && tableHeader.length > 0
                ? tableHeader.map((item: string) => {
                    menuItem === NEW_DATA_TABLES &&
                      (item = item?.replace(/\s+/g, "").toLowerCase());
                    return record[item];
                  })
                : [];
            values = values.filter(
              (item: string) =>
                typeof item === "string" || typeof item === "number"
            );
            values = [...values];
            return values.find((item: any) =>
              item && typeof item === "number"
                ? item.toString().includes(searchTerm)
                : item && item.toLowerCase().includes(searchTerm.toLowerCase())
            );
          })
        : records; */
      const fuse = new Fuse(records, {
        keys: tableHeader
      });
      const list: any = fuse.search(title === PARTNERUSER ? "" : searchTerm);
      let source = list.map((ele: any) => {
        return ele.item;
      });
      const source_reverse = source.reverse();
      let filterData = [];
      if (searchTerm === "" || title === PARTNERUSER) {
        filterData = records;
        setFilteredRecords(filterData);
      } else {
        filterData = source_reverse;
      }
      if (
        (title === EMPLOYEES || title === DYNAMIC_FORMS) &&
        selectedCountries?.length
      ) {
        filterData = filterData.filter((item: any) =>
          selectedCountries.includes(item.countryCode)
        );
      }
      if (title === "DynamicFields")
        dispatch({ type: "SET_PREVIEW_DYNAMIC_FIELDS", payload: filterData });
      setFilteredRecords(filterData);
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, searchTerm, selectedCountries, tableHeader, menuItem, title]
  );

  useEffect(() => {
    if (selectedCountry) {
      setPage(0);
      dispatch({
        type: "SET_CPQ_ROWS_PER_PAGE",
        payload: DEFAULT_ROWS_PER_PAGE
      });
    }
  }, [selectedCountry, dispatch]);

  useEffect(() => {
    handleFilterRecords();
    if (
      !isExternalTable &&
      searchTerm.length &&
      filteredRecords.length < page * rowsPerPage
    ) {
      setPage(0);
    }
  }, [
    handleFilterRecords,
    searchTerm,
    title,
    userTitleList,
    isEisEuv,
    filteredRecords.length,
    page
  ]);

  useEffect(() => {
    setPage(0);
    typeof handlePageNumChange === "function" && handlePageNumChange(0);
  }, [searchedQueryTerm]);

  countryCode = countryCode.sort(function (InitialValue: any, NextaValue: any) {
    return InitialValue.localeCompare(NextaValue);
  });

  const regularWord = (header: [], word: string, index: number) => {
    // Prepositions which are in middle of the title should be lowercase.
    const lowerCasePrepositions = ["of"];

    return (
      index !== 0 &&
      index !== header?.length - 1 &&
      lowerCasePrepositions.includes(word.toLowerCase())
    );
  };

  const getHeader = (header: any) => {
    header = header.replace(/([A-Z])/g, " $1");
    header = header.replace(/([A-Z])\s(?=[A-Z])/g, " $1");
    const splitedHeader = header.split(" ");
    return splitedHeader
      ?.map((word: string, index: number) =>
        word?.length === 2
          ? regularWord(splitedHeader, word, index)
            ? word.toLowerCase()
            : word?.toUpperCase()
          : word
      )
      ?.join(" ");
  };
  const wrapText = (text: string) => {
    return <div className={classes.wrapStyle}>{text}</div>;
  };

  if (
    userTitleList.includes(title) &&
    filteredRecords &&
    filteredRecords.length < DEFAULT_ROWS_PER_PAGE
  ) {
    props.setFilter(true);
  }

  const sortedRecords = useMemo(() => {
    const isPageLevelSort = title === ESCALATED_QUOTES;
    return isExternalTable || isPaProductLine
      ? getSortedRecord(
        filteredRecords,
        props.sortRecords,
        order,
        orderBy,
        isPageLevelSort,
        rowsPerPage,
        page
      )
      : getSortedRecord(
        filteredRecords,
        props.sortRecords,
        order,
        orderBy,
        isPageLevelSort,
        rowsPerPage,
        page
      )?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    //eslint-disable-next-line
  }, [
    filteredRecords,
    order,
    orderBy,
    page,
    props.sortRecords,
    rowsPerPage,
    isExternalTable,
    isPaProductLine
  ]);

  const showPagination = useMemo(() => {
    return (
      filteredRecords?.length >= DEFAULT_ROWS_PER_PAGE ||
      (searchTerm.length === 0 && total > DEFAULT_ROWS_PER_PAGE)
    );
  }, [filteredRecords, searchTerm.length, total]);
  const showSkeleton = !loading && sortedRecords.length !== 0;
  const finalSortedRecords =
    loading || sortedRecords.length === 0
      ? Array(rowsPerPage).fill("")
      : sortedRecords;
  const totalCount = !loading
    ? searchTerm.length && !userTitleList.includes(title)
      ? isExternalTable
        ? total
        : filteredRecords?.length
      : total
    : searchTerm === ""
      ? totalRecord
      : total;
  useEffect(() => {
    if (tableHeader) {
      dispatch({
        type: "SET_TABLE_HEADERS",
        payload: { tableHeader, menuItem: menuItem || "" }
      });
    }
    //eslint-disable-next-line
  }, [tableHeader]);

  const hasRegularHeader = (header: string) => {
    const normalTextHeaderList = ["CountriesOfBusiness"];
    return normalTextHeaderList.includes(header);
  };

  const filteredColumns = new Set([
    "countryCode",
    "EIS/EUV",
    "partnerLocationID",
    "email",
    "pa_num",
    "product_line"
  ]);
  const filterValues = [
    tableHeader[0],
    tableHeader[1],
    tableHeader[3],
    tableHeader[18]
  ];
  return (
    <Container
      maxWidth={props.maxWidth ? false : "lg"}
      disableGutters
      className={classes.mainContainer}
    >
      <Paper elevation={5}>
        <TableContainer className={classes.tableContainer}>
          {(filteredRecords && filteredRecords.length) ||
            loading ||
            noRecordFoundHeader ? (
            <Grid container className={classes.tableHeight}>
              <AutoSizer>
                {({ width, height }) => (
                  <Table
                    aria-label="a dense table"
                    size="small"
                    stickyHeader
                    style={{ height: "15vh" || height, width }}
                  >
                    {(showPagination || loading) && (
                      <caption className={classes.pagination}>
                        <Pagination
                          page={page}
                          rowsPerPage={rowsPerPage}
                          totalRecordsCount={totalCount}
                          handleChangePage={(e: any, page: number) =>
                            handleChangePage(page)
                          }
                          handleChangeRowsPerPage={handleChangeRowsPerPage}
                        />
                      </caption>
                    )}
                    <TableHead component="thead">
                      <TableRow>
                        {title !== ESCALATED_QUOTES && (
                          <StyledTableCell key={"avatar"}></StyledTableCell>
                        )}
                        {tableHeader &&
                          tableHeader.length > 0 &&
                          tableHeader.map((header: string, index: number) =>
                            title === ESCALATED_QUOTES &&
                              header === "updatedAt" ? (
                              <React.Fragment key={`tableHeader${index}`} />
                            ) : (
                              <StyledTableCell
                                component="th"
                                key={index}
                                classes={{
                                  head: hasRegularHeader(header)
                                    ? classes.headerNormal
                                    : classes.headerCapitalize
                                }}
                              >
                                {filterValues.some(tableHeader =>
                                  filteredColumns.has(tableHeader)
                                ) && filteredColumns.has(header) ? (
                                  <React.Fragment>
                                    <TableSortLabel
                                      active={orderBy === header}
                                      direction={order === ASC ? ASC : DESC}
                                      onClick={() => {
                                        onOrder();
                                        setOrderBy(header);
                                      }}
                                      className={classes.contentWidth}
                                    >
                                      {(thTitles && thTitles[header]) ||
                                        header.replace(/([A-Z])/g, " $1")}
                                    </TableSortLabel>
                                    <IconButton
                                      onClick={handleOpen}
                                      size="small"
                                      className={
                                        Object.keys(where).length > 0
                                          ? classes.filterIcon
                                          : ""
                                      }
                                    >
                                      <FilterListOutlinedIcon />
                                    </IconButton>
                                  </React.Fragment>
                                ) : (
                                  <TableSortLabel
                                    active={orderBy === header}
                                    direction={order === ASC ? ASC : DESC}
                                    onClick={() => {
                                      onOrder();
                                      setOrderBy(header);
                                    }}
                                    className={classes.contentWidth}
                                  >
                                    {(thTitles && thTitles[header]) ||
                                      getHeader(header)}
                                  </TableSortLabel>
                                )}
                              </StyledTableCell>
                            )
                          )}
                        {title !== IQ_CH_ROUTING &&
                          title !== ESCALATED_QUOTES && (
                            <React.Fragment>
                              <StyledTableCell key={"UpdatedAt"}>
                                <TableSortLabel
                                  active={
                                    orderBy ===
                                    (menuItem === NEW_DATA_TABLES
                                      ? "updatedat"
                                      : "updatedAt")
                                  }
                                  direction={order === ASC ? ASC : DESC}
                                  onClick={() => {
                                    onOrder();
                                    setOrderBy(
                                      menuItem === NEW_DATA_TABLES
                                        ? "updatedat"
                                        : "updatedAt"
                                    );
                                  }}
                                  className={classes.contentWidth}
                                >
                                  {"Updated At"}
                                </TableSortLabel>
                              </StyledTableCell>
                              <StyledTableCell key={"UpdatedBy"}>
                                {"Updated By"}
                              </StyledTableCell>
                            </React.Fragment>
                          )}
                        <StyledTableCell key={"delete"}></StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(filteredRecords && filteredRecords.length) ||
                        loading ? (
                        finalSortedRecords.map((row: any, index: number) => (
                          <TableRow
                            className={classes.tableRow}
                            onClick={() => {
                              isVisible(
                                `${title.replace(/\s+/g, "").toUpperCase()}.EDIT`
                              ) &&
                                handleEditClick &&
                                handleEditClick(row);
                            }}
                            key={index}
                            onMouseEnter={() =>
                              dispatch({
                                type: "SET_HOVER_INDEX",
                                payload: index
                              })
                            }
                            onMouseLeave={() =>
                              dispatch({ type: "SET_HOVER_INDEX", payload: "" })
                            }
                          >
                            {title !== ESCALATED_QUOTES && (
                              <TableCell
                                key={"edit"}
                                className={`${row.tags &&
                                  row.tags.length > 0 &&
                                  classes.tagsSpace
                                  }`}
                              >
                                {showSkeleton ? (
                                  <RecordAvatar
                                    avatar={
                                      avatar?.length > 1
                                        ? row &&
                                        `${row[avatar[0]]} ${row[avatar[1]]}`
                                        : row && row[avatar]
                                    }
                                    name={
                                      title === "Quote Validity Check"
                                        ? row.country
                                        : row.name || row.prismFacet || row.id
                                    }
                                    rowIndex={index}
                                  />
                                ) : (
                                  <CustomTableSkeleton variantType="circular" />
                                )}
                              </TableCell>
                            )}
                            {tableHeader.map(
                              (header: string, cellIndex: number) => {
                                menuItem === NEW_DATA_TABLES &&
                                  (header = header
                                    ?.replace(/\s+/g, "")
                                    .toLowerCase());
                                return (
                                  <TableCell
                                    className={`${classes.mark} ${row.tags &&
                                      row.tags.length > 0 &&
                                      classes.tagsSpace
                                      }`}
                                    style={{
                                      fontFamily:
                                        title === ESCALATED_QUOTES &&
                                          (header === "opportunityID" ||
                                            header === "quoteNumber" ||
                                            header === "totalListPrice" ||
                                            header === "totalReq'dPrice")
                                          ? "sans-serif"
                                          : "hp_simplifiedregular",
                                      whiteSpace: "normal"
                                    }}
                                    key={
                                      title === ESCALATED_QUOTES
                                        ? cellIndex
                                        : cellIndex + 1
                                    }
                                    scope="row"
                                    onClick={e => {
                                      if (
                                        header === "dynamicFields" ||
                                        header === "permissions" ||
                                        header === "groups" ||
                                        header === "CountriesOfBusiness" ||
                                        header === "Groups" ||
                                        header === "EIS/EUV" ||
                                        header === "RevisionHistory" ||
                                        header === "History"
                                      ) {
                                        e.stopPropagation();
                                      }
                                    }}
                                  >
                                    {showSkeleton ? (
                                      <Highlight search={searchTerm}>
                                        {header === "dynamicFields" ? (
                                          <props.dynamicFields
                                            dynamicForm={row}
                                          />
                                        ) : header === "EIS/EUV" ? (
                                          <props.eisEuvFields
                                            handleHPQuote={() =>
                                              handleChangePage(0)
                                            }
                                            quote={row}
                                          />
                                        ) : title === ESCALATED_QUOTES &&
                                          header === "updatedAt" ? (
                                          <React.Fragment />
                                        ) : header === "reassign" ? (
                                          <props.Reassign
                                            setRecords={props.setRecords}
                                            currentRecord={row}
                                            page={props.page}
                                            setTotal={props.setTotal}
                                            decorateFormat={props.decorateFormat}
                                            records={props.records}
                                          />
                                        ) : header === "RevisionHistory" ? (
                                          <props.revisionHistory quote={row} />
                                        ) : header === "History" ? (
                                          <props.history />
                                        ) : header === "permissions" ? (
                                          <props.permissions role={row} />
                                        ) : header === "lastLoggedIn" ||
                                          header === "createdat" ? (
                                          getLogDetails(row[header])
                                        ) : header === "updatedBy" ? (
                                          row["updatedBy"] &&
                                          row["updatedBy"].name
                                        ) : header === "groups" ? (
                                          <props.roles role={row} />
                                        ) : header === "Groups" ? (
                                          <props.groups row={row} />
                                        ) : header === "CountriesOfBusiness" ? (
                                          <props.countriesOfBusiness
                                            countriesOfBusiness={
                                              row?.countriesOfBusiness
                                            }
                                            rowId={row?.id}
                                          />
                                        ) : booleanHeader &&
                                          booleanHeader.includes(header) ? (
                                          String(row[header])
                                        ) : header === "subject" ? (
                                          wrapText(row[header])
                                        ) : header ===
                                          "supportteamemailaddress" ? (
                                          row["value"]
                                        ) : header === "escalatedDate/Time" ? (
                                          row[header] ? (
                                            moment
                                              .utc(row[header])
                                              .format("MMM Do, YYYY h:mm a")
                                          ) : (
                                            ""
                                          )
                                        ) : header === "totalListPrice" ||
                                          header === "totalReq'dPrice" ? (
                                          (row[header] ? row[header] : 0)
                                            ?.toFixed(2)
                                            ?.toString()
                                            ?.replace(
                                              /\B(?=(\d{3})+(?!\d))/g,
                                              ","
                                            )
                                        ) : header === "trans_date" ? (
                                          row[header] ? (
                                            moment
                                              .utc(row[header])
                                              .format("MMM Do, YYYY")
                                          ) : (
                                            ""
                                          )
                                        ) : [
                                          "salesRepManagerEmail",
                                          "salesRepEmail"
                                        ].includes(header) ? (
                                          <Typography variant="caption">
                                            {row[header]}
                                          </Typography>
                                        ) : ["pa_num"].includes(header) ? (
                                          row.paNum || row.pa_num
                                        ) : ["product_line"].includes(header) ? (
                                          row.productLine || row.product_line
                                        ) : (
                                          row[header]
                                        )}
                                      </Highlight>
                                    ) : (
                                      <CustomTableSkeleton
                                        {...(header === "Groups"
                                          ? { variantType: "circular" }
                                          : { variantType: "rectangular" })}
                                        header={header}
                                      />
                                    )}
                                  </TableCell>
                                );
                              }
                            )}
                            {title !== IQ_CH_ROUTING &&
                              title !== ESCALATED_QUOTES && (
                                <React.Fragment>
                                  <TableCell>
                                    {showSkeleton ? (
                                      moment(
                                        row.updatedAt || row.updatedat
                                      ).format("lll") === "Invalid date" ? (
                                        getDate(
                                          row.updatedAt || row.updatedat || ""
                                        )
                                      ) : (
                                        moment(
                                          row.updatedAt || row.updatedat
                                        ).format("lll")
                                      )
                                    ) : (
                                      <CustomTableSkeleton variantType="rectangular" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {showSkeleton ? (
                                      row.updatedById ===
                                        "00000000-0000-0000-0000-000000000000" ? (
                                        "IQ Bot"
                                      ) : (
                                        row.updatedBy?.name ||
                                        row.updatedbyid ||
                                        row.updatedById ||
                                        row.updatedByID
                                      )
                                    ) : (
                                      <CustomTableSkeleton variantType="rectangular" />
                                    )}
                                  </TableCell>
                                </React.Fragment>
                              )}
                            <TableCell key={"delete"}>
                              {isVisible(
                                `${title
                                  .replace(/\s+/g, "")
                                  .toUpperCase()}.DELETE`
                              ) &&
                                handleDelete &&
                                !hpQuoteVisibility && (
                                  <Tooltip placement="right" title={"Delete"}>
                                    <IconButton
                                      className={classes.deleteButton}
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleDeleteClick(e, row.id);
                                      }}
                                      size="large"
                                    >
                                      {showSkeleton ? (
                                        <DeleteIcon
                                          className={classes.deleteIcon}
                                        />
                                      ) : (
                                        <CustomTableSkeleton variantType="circular" />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                )}
                            </TableCell>
                            {row.tags && row.tags.length > 0 && (
                              <TableCell className={classes.tags}>
                                <ActiveTags tags={row.tags} />
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      ) : (
                        <NoResultFound
                          primaryText="No records found"
                          customstyle={{ position: "absolute", width: "100%" }}
                        />
                      )}
                    </TableBody>
                  </Table>
                )}
              </AutoSizer>
            </Grid>
          ) : (
            <NoResultFound primaryText="No records found" />
          )}

          <Popover
            open={open}
            onClose={handleClose}
            anchorReference="anchorPosition"
            anchorPosition={
              isDrawerOpen ? { top: 115, left: 408 } : { top: 115, left: 220 }
            }
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right"
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left"
            }}
          >
            {title === PA_PRODUCT_LINES || title === PARTNERUSER ? (
              <ColumnFilter
                tableHeader={
                  title === PA_PRODUCT_LINES ? paProducline : partnersUserHeader
                }
                open={open}
                setOpen={setOpen}
                thTitles={thTitles}
                getHeader={getHeader}
              />
            ) : (
              <List className={classes.root}>
                {title === HP_QUOTE
                  ? ["EIS", "EUV"].map((code: string, index: number) => (
                    <ListItem className={classes.listItem} key={index}>
                      <Checkbox
                        edge="start"
                        value={code}
                        onChange={onCheck}
                        checked={isEisEuv === code}
                      />
                      <ListItemText primary={code} />
                    </ListItem>
                  ))
                  : countryCode.map((code: string, index: number) => (
                    <ListItem className={classes.listItem} key={index}>
                      <Checkbox
                        edge="start"
                        value={code}
                        onChange={onCheck}
                        checked={selectedCountries.includes(code)}
                      />
                      <ListItemText primary={code} />
                    </ListItem>
                  ))}
              </List>
            )}
          </Popover>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default memo(CustomTable);
