/*
 * Smart Solar Microgrid Trading System
 * Author: Shakanyah - IT23214002
 * Author: Sithmi - IT23241114
 * Author: Clerin - IT23402584
 * Author: Thuverakan - IT23281332
 * File: ExceptionHandlingMiddleware.cs
 * Purpose: Converts application exceptions into consistent
 *          HTTP status codes and JSON error responses.
 */

using System.Net;
using System.Text.Json;
using SmartSolarMicrogrid.Api.Exceptions;

namespace SmartSolarMicrogrid.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        // Responsible: Shakanyah - IT23214002; Sithmi - IT23241114; Clerin - IT23402584; Thuverakan - IT23281332
        // Store middleware dependencies.
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(
        HttpContext context)
    {
        // Responsible: Shakanyah - IT23214002; Sithmi - IT23241114; Clerin - IT23402584; Thuverakan - IT23281332
        // Continue the request pipeline and convert known exceptions to HTTP responses.
        try
        {
            await _next(context);
        }
        catch (UnauthorizedAccessException ex)
        {
            await WriteErrorResponseAsync(
                context,
                HttpStatusCode.Unauthorized,
                ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            await WriteErrorResponseAsync(
                context,
                HttpStatusCode.NotFound,
                ex.Message);
        }
        catch (ConflictException ex)
        {
            await WriteErrorResponseAsync(
                context,
                HttpStatusCode.Conflict,
                ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            await WriteErrorResponseAsync(
                context,
                HttpStatusCode.BadRequest,
                ex.Message);
        }
        catch (ArgumentException ex)
        {
            await WriteErrorResponseAsync(
                context,
                HttpStatusCode.BadRequest,
                ex.Message);
        }
        catch (Exception ex)
        {
            // Log only unexpected application failures as server errors.
            _logger.LogError(
                ex,
                "An unexpected exception occurred.");

            await WriteErrorResponseAsync(
                context,
                HttpStatusCode.InternalServerError,
                "An unexpected server error occurred.");
        }
    }

    private static async Task WriteErrorResponseAsync(
        HttpContext context,
        HttpStatusCode statusCode,
        string message)
    {
        // Responsible: Shakanyah - IT23214002; Sithmi - IT23241114; Clerin - IT23402584; Thuverakan - IT23281332
        // Return a consistent JSON error payload to web and Android clients.
        context.Response.StatusCode =
            (int)statusCode;

        context.Response.ContentType =
            "application/json";

        var response = new
        {
            statusCode =
                context.Response.StatusCode,

            message
        };

        var json =
            JsonSerializer.Serialize(response);

        await context.Response.WriteAsync(json);
    }
}
