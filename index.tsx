import { useLazyQuery, useMutation } from "@apollo/client";
import Grid from "@mui/material/Grid";
import { useResourceVisibility } from "common/util";
import Add from "components/Add";
import CustomTable from "components/CustomTable";
import Delete from "components/Delete";
import Edit from "components/Edit";
import SpeedDials from "components/SpeedDials";
import Tile from "components/Tile";
import TileSkeleton from "components/TileSkeleton";
import UploadFile from "components/UploadFile";
import Fuse from "fuse.js";
import { useSnackbar } from "notistack";
import React, { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "reducers";
import { generateCSV } from "../../common/util";
import { IexistingFormData, IList, ISalesRep } from "./Fields";
import Form from "./Form";
import { DELETE_SALES_REP, GET_SALES_REP } from "./GraphQL";

const SalesRep = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const isVisible = useResourceVisibility();
  const currentRecord = useSelector<RootState, ISalesRep>(
    state => state.salesRepReducer.selectedSalesRep
  );
  const salesReps = useSelector<RootState, ISalesRep[]>(
    state => state.salesRepReducer.salesReps
  );
  const selectedRecord = useSelector<RootState>(
    state => state.salesRepReducer.selected
  );
  const selectedID = useSelector<RootState, string>(
    state => state.salesRepReducer.selected.id
  );
  const selectedElements = useSelector<RootState, HTMLElement[]>(
    state => state.salesRepReducer.selected.elements
  );
  const { rowsPerPage, downloadFlag, title } = useSelector(
    (state: RootState) => state.dashboardReducer
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [records, setRecords] = useState<ISalesRep[]>([]);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [total, setTotal] = useState(0);
  const [originTotal, setoriginTotal] = useState(0);
  const [upload, setUpload] = useState<boolean>(false);
  const searchTerm = useSelector(
    (state: RootState) => state.dashboardReducer.searchTerm
  );
  const [page, setPage] = useState(0);
  let snackbarKey: number | string;

  useEffect(() => {
    setRecords(salesReps);
  }, [salesReps]);
  const [getSalesRep] = useLazyQuery(GET_SALES_REP, {
    fetchPolicy: "cache-and-network",
    onCompleted({ salesRepBackups }) {
      let updatedReps = salesReps;
      if (updatedReps.length > 0) {
        salesRepBackups.salesRepBackups.forEach((each: IexistingFormData) => {
          const index = updatedReps.filter(
            (rep: ISalesRep) => rep.id === each.id
          );

          if (index.length === 0) updatedReps = [...updatedReps, each];
        });
      } else {
        updatedReps = [...salesRepBackups.salesRepBackups];
      }
      setRecords(updatedReps);
      setLoading(false);
      setTotal(salesRepBackups.total);
      setoriginTotal(salesRepBackups.total);
      dispatch({
        type: "SET_SALES_REP",
        payload: updatedReps
      });
    },
    onError() {
      setLoading(false);
    }
  });

  useEffect(() => {
    getSalesRep({
      variables: {
        offset: page * rowsPerPage,
        limit: rowsPerPage
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (downloadFlag) {
      generateCSV(records, title);
      dispatch({
        type: "SET_DOWNLOAD_FLAG",
        payload: false
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadFlag]);

  const handleChangePage = (page: number) => {
    setPage(page);
  };

  const updateCache = (cache: any, { data }: any) => {
    const existingData = cache.readQuery({
      query: GET_SALES_REP,
      variables: {
        offset: page * rowsPerPage,
        limit: rowsPerPage
      }
    });
    const existingFormData = existingData.salesRepBackups.salesRepBackups;
    setTotal(existingData.salesRepBackups.total - 1);
    const updatedData = {
      salesRepBackups: {
        total: existingData.salesRepBackups.total - 1,
        salesRepBackups: existingFormData.filter(
          (each: IexistingFormData) => each.id !== data.deleteSalesRepBackup
        )
      }
    };

    cache.writeQuery({
      query: GET_SALES_REP,
      variables: {
        offset: page * rowsPerPage,
        limit: rowsPerPage
      },
      data: updatedData
    });
    return updatedData;
  };

  const [remove] = useMutation(DELETE_SALES_REP, {
    update: updateCache,
    onCompleted({ deleteSalesRepBackup }) {
      closeSnackbar(snackbarKey);
      setRecords(salesReps.filter(rep => rep.id !== deleteSalesRepBackup));
      dispatch({ type: "DELETE_SALES_REP", payload: deleteSalesRepBackup });
      enqueueSnackbar("Deleted", {
        variant: "success"
      });
      handleClose();
      selectedElements.forEach((element: HTMLElement) => {
        element.style.opacity = "1";
      });
    },
    onError() {
      setLoading(false);
      selectedElements.forEach((element: HTMLElement) => {
        element.style.opacity = "1";
      });
      dispatch({
        type: "SET_SELECTED_SALES_REP",
        payload: { id: "", elements: [] }
      });
      closeSnackbar(snackbarKey);
    }
  });

  const handleDelete = (id: string, element: HTMLElement) => {
    snackbarKey = enqueueSnackbar("Deleting...", {
      variant: "info",
      persist: true
    });
    dispatch({
      type: "SET_SELECTED_SALES_REP",
      payload: {
        id,
        elements: selectedElements ? [...selectedElements, element] : [element]
      }
    });
    try {
      remove({
        variables: {
          id: id
        }
      });
    } catch (e) {
      console.error("=> handleDelete : ", e);
    }
  };
  const handleEditClick = (record: ISalesRep) => {
    setEditOpen(true);
    dispatch({
      type: "SET_SELECTED_SALES_REP",
      payload: record
    });
  };
  const openDeleteConfirmation = (id: string, element: HTMLElement) => {
    setDeleteOpen(true);
    dispatch({
      type: "SET_SELECTED_SALES_REP",
      payload: { id, elements: [...selectedElements, element] }
    });
  };
  const handleAddOpen = () => {
    setAddOpen(true);
  };
  const handleClose = () => {
    setAddOpen(false);
    setEditOpen(false);
    setDeleteOpen(false);
    setUpload(false);
    selectedElements &&
      selectedElements.forEach((element: HTMLElement) => {
        element.style.opacity = "1";
      });
    dispatch({
      type: "SET_SELECTED_SALES_REP",
      payload: ""
    });
  };

  const view = useSelector<RootState, string>(
    state => state.dashboardReducer.view
  );

  useEffect(() => {
    setTotal(total);
    const fuse = new Fuse(records, {
      keys: ["salesRepEmail", "backupEmail"]
    });
    const list: IList[] = fuse.search(searchTerm);
    const source = list.map((ele: IList) => {
      return ele.item;
    });
    if (searchTerm === "") {
      setRecords(salesReps);
      setTotal(originTotal);
    } else {
      const total = source.length;
      setRecords(source);
      setTotal(total);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsPerPage, total, originTotal, records.length, searchTerm]);

  const handleUploadOpen = () => {
    setUpload(true);
  };

  return (
    <Fragment>
      <Grid container>
        <Grid item xs={12}>
          {view === "list" ? (
            <CustomTable
              avatar={["salesRepEmail"]}
              loading={loading}
              records={records}
              openDeleteConfirmation={openDeleteConfirmation}
              handleEditClick={handleEditClick}
              handleDelete={handleDelete}
              total={total}
              tableHeader={["salesRepEmail", "backupEmail"]}
              title="Sales Rep"
              handleChangePage={handleChangePage}
              maxWidth="false"
            />
          ) : !loading ? (
            <Tile
              avatar={["salesRepEmail", "backupEmail"]}
              records={records}
              openDeleteConfirmation={openDeleteConfirmation}
              handleEditClick={handleEditClick}
              handleDelete={handleDelete}
              tableHeader={["salesRepEmail", "backupEmail"]}
            />
          ) : (
            <TileSkeleton numOfTiles={6} timeout={2000} />
          )}
        </Grid>
        {addOpen && (
          <Add
            child={Form}
            title="Add Sales Rep"
            open={addOpen}
            action={"add"}
            handleAddOpen={(param: boolean) => setAddOpen(param)}
            handleClose={handleClose}
            setTotal={setTotal}
            offset={page * rowsPerPage}
          />
        )}
        {editOpen && (
          <Edit
            avatar={["salesRepEmail", "backupEmail"]}
            child={Form}
            title="Edit Sales Rep"
            open={editOpen && currentRecord && selectedID === currentRecord.id}
            currentRecord={currentRecord}
            action={"update"}
            handleClose={handleClose}
            offset={page * rowsPerPage}
          />
        )}
        <Delete
          record={selectedRecord}
          open={deleteOpen}
          handleDelete={handleDelete}
          handleClose={handleClose}
          openDeleteConfirmation={openDeleteConfirmation}
        />
        {upload && <UploadFile handleClose={handleClose} />}
        {isVisible("SALESREP.ADD") && (
          <SpeedDials
            handleAddOpen={handleAddOpen}
            handleUploadOpen={handleUploadOpen}
            records={records}
            title={title}
            total={total}
          />
        )}
      </Grid>
    </Fragment>
  );
};

export default SalesRep;
