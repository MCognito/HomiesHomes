import axios from "axios";

const api = axios.create({
  baseURL: "https://gammacairo-deltareward-9000.codio-box.uk/api",
});

export default api;
