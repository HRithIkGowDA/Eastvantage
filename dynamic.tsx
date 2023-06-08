import { useMutation } from "@apollo/client";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import { green } from "@mui/material/colors";
import makeStyles from "@mui/styles/makeStyles";
import { fieldValidation, formValidation } from "common/Validations";
import Button from "components/Button";
import { useSnackbar } from "notistack";
import React, { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "reducers";
import { ADD_NOTIFICATION, IForm, INotificationFields, INotificationTemplate, SET_SELECTED_NOTIFICATION, UPDATE_NOTIFICATION, getFields } from "./Fields";
import { CREATE_NOTIFICATION_TEMPLATE, GET_NOTIFICATION_TEMPLATES, UPDATE_NOTIFICATION_TEMPLATE } from "./GraphQL";
import HighlightHTML from "./highlightHTML";

const useStyles = makeStyles(theme => ({
  errorText: {
    color: "red",
    display: "block"
  },
  formControl: {
    margin: theme.spacing(1, 1, 1, 0),
    minWidth: 120,
    width: "100%"
  },
  selectEmpty: {
    marginTop: theme.spacing(2)
  },
  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12
  },
  wrapper: {
    position: "relative"
  },
  buttonBase: {
    color: "#fff",
    backgroundColor: "#0096d6",
    padding: "4px 10px"
  }
}));

const Form = (props: IForm) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  let snackbarKey: number | string;
  const dispatch = useDispatch();
  const { currentRecord } = props;
  const formFields = getFields(currentRecord);
  const [record, setRecord] = useState<INotificationFields[]>(formFields);
  const [loading, setLoading] = useState<boolean>(false);
  const { loggedInUserEmail } = useSelector((state: RootState) => state.dashboardReducer);
  const addToCache = (cache: any, { data }: any) => {
    const exisitingNotifications = cache.readQuery({ query: GET_NOTIFICATION_TEMPLATES });
    const newData = data.createNotificationTemplate;
    const updatedData = {
      notificationTemplates: [{ ...newData, updatedAt: new Date() }, ...exisitingNotifications.notificationTemplates.notificationTemplates]
    };
    cache.writeQuery({ query: GET_NOTIFICATION_TEMPLATES, data: updatedData });
  };
  const [add] = useMutation(CREATE_NOTIFICATION_TEMPLATE, {
    update: addToCache,
    onCompleted({ createNotificationTemplate }) {
      closeSnackbar(snackbarKey);
      dispatch({ type: ADD_NOTIFICATION, payload: { id: createNotificationTemplate.id, updatedAt: new Date(), ...notification } });
      enqueueSnackbar("Saved successfully", { variant: "success" });
      setRecord(formFields);
      setLoading(true);
      props.handleClose();
    },
    onError() {
      setLoading(false);
      closeSnackbar(snackbarKey);
    }
  });
  const updateToCache = (cache: any, { data }: any) => {
    const existingNotifications = cache.readQuery({ query: GET_NOTIFICATION_TEMPLATES });
    const existingFormsData = existingNotifications.notificationTemplates;
    const updatedNotification = {
      notificationTemplates: {
        ...existingFormsData,
        notificationTemplates: existingFormsData.notificationTemplates.map((each: INotificationTemplate) => each.id === data.updateNotificationTemplate
          ? { ...each, ...notification, updatedAt: new Date(), updatedBy: { name: loggedInUserEmail } }
          : each
        )
      }
    };
    cache.writeQuery({ query: GET_NOTIFICATION_TEMPLATES, data: updatedNotification });
    return updatedNotification;
  };

  const [update] = useMutation(UPDATE_NOTIFICATION_TEMPLATE, {
    update: updateToCache,
    onCompleted() {
      closeSnackbar(snackbarKey);
      dispatch({ type: UPDATE_NOTIFICATION, payload: { id: currentRecord.id, notification: { ...notification, updatedAt: new Date(), updatedBy: { name: loggedInUserEmail } } } });
      enqueueSnackbar("Updated", { variant: "success" });
      dispatch({ type: SET_SELECTED_NOTIFICATION, payload: "" });
      setLoading(false);
      props.handleClose();
    },
    onError() {
      setLoading(false);
      closeSnackbar(snackbarKey);
    }
  });

  const handleInputChange = (field: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const formFields = record.map((input: INotificationFields) => {
      if (input.name === field) {
        input.value = e.target.value;
      }
      return input;
    });
    setRecord(formFields);
  };

  const getRecord = () => record.reduce((obj: Object, item: INotificationFields) => Object.assign(obj, { [item.name]: item.value }), {});

  const notification = getRecord();

  const addRecord = (e: React.MouseEvent) => {
    setRecord(formValidation(record));
    if (record.filter(field => field.error === true).length === 0) {
      setLoading(true);
      snackbarKey = enqueueSnackbar(t("common:snackbar.saving"), { variant: "info", persist: true });
      try {
        add({ variables: { input: { name: notification.name, type: notification.type, subject: notification.subject, content: notification.content, language: notification.language } } });
      } catch (e) {
        console.error("=> addRecord : ", e);
      }
    }
  };

  const updateRecord = (e: React.MouseEvent) => {
    setRecord(formValidation(record));
    if (record.filter(field => field.error === true).length === 0) {
      setLoading(true);
      snackbarKey = enqueueSnackbar("Updating...", { variant: "info", persist: true });
      try {
        update({ variables: { id: currentRecord.id, input: { name: notification.name, type: notification.type, subject: notification.subject, content: notification.content, language: notification.language } } });
      } catch (e) {
        console.error("=> updateRecord : ", e);
        props.handleClose();
      }
    }
  };

  return (
    <Fragment>
      <Grid container spacing={1}>
        {record.filter((data: INotificationFields) => data.label.toLowerCase() === "content").map((data: INotificationFields, index: number) => (
          <Grid item key={`${index}`} xs={12}>
            <HighlightHTML data={data} handleInputChange={handleInputChange} setRecord={setRecord} record={record} fieldValidation={fieldValidation} />
          </Grid>
        ))}
        {record.filter((data: INotificationFields) => data.label.toLowerCase() !== "content").map((data: INotificationFields, index: number) => (
          <Grid item key={`${index}`} xs={4}>
            <TextField variant="standard" fullWidth required={data.required} error={data.error} margin="dense" name={data.name} label={data.label} type={data.type} onChange={event => handleInputChange(data.name, event)} value={data.value} onBlur={event => setRecord(fieldValidation(record, data.name, event))} helperText={data.error_message} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={1} style={{ justifyContent: "flex-end", marginTop: 4 }}>
        {props.action === "add" ? (
          <Grid item className={classes.wrapper}>
            <Button id="notificationAddForm" variant="contained" color="primary" size="small" onClick={addRecord} disabled={loading} loading={loading}>Add</Button>
          </Grid>
        ) : (
          <Fragment>
            <Grid item className={classes.wrapper}>
              <Button id="notificationUpdateForm" className={classes.buttonBase} variant="contained" size="small" disabled={loading} onClick={updateRecord} loading={loading}>Update</Button>
            </Grid>
          </Fragment>
        )}
      </Grid>
    </Fragment>
  );
};

export default Form;
