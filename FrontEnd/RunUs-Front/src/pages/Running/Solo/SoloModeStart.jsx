import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import "../../../styles/Running/Solo/SoloModeStart.css";

const SoloModeStart = () => {
  const [time, setTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [isRunning, setIsRunning] = useState(true);
  const [error, setError] = useState(null);
  const prevLocation = useRef({
    latitude: null,
    longitude: null,
    timestamp: null,
    speed: null,
  });
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    const handleSuccess = (position) => {
      const { latitude, longitude, speed } = position.coords;
      const currentTime = Date.now();

      if (
        prevLocation.current.latitude !== null &&
        prevLocation.current.longitude !== null
      ) {
        const timeElapsed =
          (currentTime - prevLocation.current.timestamp) / 1000;
        const maxPossibleDistance =
          (prevLocation.current.speed || 0) * timeElapsed;
        const dist = calculateDistance(
          prevLocation.current.latitude,
          prevLocation.current.longitude,
          latitude,
          longitude
        );

        if (dist > maxPossibleDistance) {
          const correctedLocation = correctLocation(
            prevLocation.current.latitude,
            prevLocation.current.longitude,
            latitude,
            longitude,
            maxPossibleDistance
          );
          setDistance((prevDistance) => prevDistance + maxPossibleDistance);
          prevLocation.current = {
            ...correctedLocation,
            timestamp: currentTime,
            speed,
          };
          setLocation(correctedLocation);
        } else {
          setDistance((prevDistance) => prevDistance + dist);
          prevLocation.current = {
            latitude,
            longitude,
            timestamp: currentTime,
            speed,
          };
          setLocation({ latitude, longitude });
        }
      } else {
        prevLocation.current = {
          latitude,
          longitude,
          timestamp: currentTime,
          speed,
        };
        setLocation({ latitude, longitude });
      }
    };

    const handleError = (error) => {
      setError(error.message);
    };

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
    };

    if (isRunning) {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      );
      const watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        options
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const handleToggle = () => {
    setIsRunning((prev) => !prev);
  };

  const handleEnd = async () => {
    const result = await Swal.fire({
      title: "정말 종료하시겠습니까?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "예, 종료합니다",
      cancelButtonText: "아니오, 계속하기",
      customClass: {
        popup: "custom-swal-popup",
        title: "custom-swal-title",
      },
    });

    if (result.isConfirmed) {
      navigate("/home");
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const rad = Math.PI / 180;
    const φ1 = lat1 * rad;
    const φ2 = lat2 * rad;
    const Δφ = (lat2 - lat1) * rad;
    const Δλ = (lon2 - lon1) * rad;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const correctLocation = (lat1, lon1, lat2, lon2, maxDist) => {
    const dist = calculateDistance(lat1, lon1, lat2, lon2);
    const ratio = maxDist / dist;
    const correctedLat = lat1 + (lat2 - lat1) * ratio;
    const correctedLon = lon1 + (lon2 - lon1) * ratio;
    return { latitude: correctedLat, longitude: correctedLon };
  };

  return (
    <div className="SoloModeStart">
      <button className="back-button" onClick={() => navigate("/home")}>
        <FontAwesomeIcon icon={faArrowLeft} size="lg" />
      </button>
      <h1>Solo Mode</h1>
      {error ? (
        <p>Error: {error}</p>
      ) : (
        <>
          <p>Elapsed Time: {formatTime(time)}</p>
          <p>Latitude: {location.latitude}</p>
          <p>Longitude: {location.longitude}</p>
          <p>Distance traveled: {distance.toFixed(2)} meters</p>
          <button onClick={handleToggle}>{isRunning ? "Stop" : "Start"}</button>
          <button onClick={handleEnd}>End</button>
        </>
      )}
      <div>ㅎㅇ</div>
    </div>
  );
};

export default SoloModeStart;
